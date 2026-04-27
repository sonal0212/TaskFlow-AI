package com.taskflow.task;

import com.taskflow.common.error.ApiException;
import com.taskflow.domain.Task;
import com.taskflow.domain.repo.TaskRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** BRD §FR-3.* — task CRUD with optimistic concurrency and outbox-friendly writes. */
@RestController
@RequestMapping("/api/v1")
public class TaskController {

    private final TaskRepository tasks;

    public TaskController(TaskRepository tasks) { this.tasks = tasks; }

    public record TaskDto(
        UUID id, UUID projectId, String title, String description,
        Task.TaskStatus status, Task.TaskPriority priority,
        UUID assigneeId, LocalDate dueDate, double position, int version
    ) {
        public static TaskDto from(Task t) {
            return new TaskDto(t.getId(), t.getProjectId(), t.getTitle(), t.getDescription(),
                t.getStatus(), t.getPriority(), t.getAssigneeId(), t.getDueDate(),
                t.getPosition(), t.getVersion());
        }
    }

    public record CreateRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        Task.TaskStatus status,
        Task.TaskPriority priority,
        UUID assigneeId,
        LocalDate dueDate
    ) {}

    public record PatchRequest(
        String title, String description, Task.TaskStatus status,
        Task.TaskPriority priority, UUID assigneeId, LocalDate dueDate, Double position
    ) {}

    @GetMapping("/projects/{projectId}/tasks")
    public List<TaskDto> list(@PathVariable UUID projectId) {
        return tasks.findAllByProjectIdAndDeletedAtIsNullOrderByPositionAsc(projectId)
            .stream().map(TaskDto::from).toList();
    }

    @PostMapping("/projects/{projectId}/tasks")
    @Transactional
    public ResponseEntity<TaskDto> create(
        @PathVariable UUID projectId,
        @Valid @RequestBody CreateRequest req,
        @AuthenticationPrincipal String userId
    ) {
        UUID me = UUID.fromString(userId);
        double pos = tasks.findAllByProjectIdAndDeletedAtIsNullOrderByPositionAsc(projectId)
            .stream().mapToDouble(Task::getPosition).max().orElse(0d) + 1024d;

        Task task = Task.builder()
            .projectId(projectId)
            .title(req.title())
            .description(req.description())
            .status(req.status() == null ? Task.TaskStatus.TODO : req.status())
            .priority(req.priority() == null ? Task.TaskPriority.P2 : req.priority())
            .assigneeId(req.assigneeId())
            .dueDate(req.dueDate())
            .position(pos)
            .createdBy(me)
            .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(TaskDto.from(tasks.save(task)));
    }

    @PatchMapping("/tasks/{id}")
    @Transactional
    public TaskDto patch(@PathVariable UUID id,
                         @RequestHeader(value = "If-Match", required = false) Integer ifMatch,
                         @RequestBody PatchRequest req) {
        Task t = tasks.findById(id).orElseThrow(() ->
            new ApiException("TASK_NOT_FOUND", "Task not found.", HttpStatus.NOT_FOUND));
        if (ifMatch != null && ifMatch != t.getVersion()) {
            // BRD §FR-3.2 — return 409 with current state on version mismatch
            throw new ApiException("VERSION_CONFLICT",
                "Task was modified by someone else. Refresh and try again.", HttpStatus.CONFLICT);
        }
        if (req.title() != null) t.setTitle(req.title());
        if (req.description() != null) t.setDescription(req.description());
        if (req.status() != null) t.setStatus(req.status());
        if (req.priority() != null) t.setPriority(req.priority());
        if (req.assigneeId() != null) t.setAssigneeId(req.assigneeId());
        if (req.dueDate() != null) t.setDueDate(req.dueDate());
        if (req.position() != null) t.setPosition(req.position());
        return TaskDto.from(tasks.save(t));
    }

    @DeleteMapping("/tasks/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        Task t = tasks.findById(id).orElseThrow(() ->
            new ApiException("TASK_NOT_FOUND", "Task not found.", HttpStatus.NOT_FOUND));
        t.setDeletedAt(java.time.Instant.now());
        tasks.save(t);
        return ResponseEntity.noContent().build();
    }
}
