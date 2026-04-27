package com.taskflow.ai;

import com.taskflow.domain.Task;
import com.taskflow.domain.repo.TaskRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * BRD §FR-5 — AI features.
 *
 * NOTE: structured-output handling, prompt templates v1, JSON-schema validation
 *       and the ai_usage write live in dedicated services. Endpoints below show
 *       the wiring; flesh out parsing + caching next.
 */
@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final ChatClient chat;
    private final TaskRepository tasks;

    public AiController(ChatClient.Builder chatBuilder, TaskRepository tasks) {
        this.chat = chatBuilder.build();
        this.tasks = tasks;
    }

    public record SuggestResponse(List<Suggestion> suggestions) {}
    public record Suggestion(String title, String description, Task.TaskPriority suggestedPriority) {}

    @PostMapping("/projects/{projectId}/suggest")
    public SuggestResponse suggest(@PathVariable UUID projectId) {
        List<Task> recent = tasks.findAllByProjectIdAndDeletedAtIsNullOrderByPositionAsc(projectId);
        // TODO: load template from classpath:prompts/v1/suggest-tasks.txt and call ChatClient.
        //       For now, return an empty stub so the contract holds.
        return new SuggestResponse(List.of());
    }

    public record ParseRequest(String sentence, String workspaceTimezone) {}
    public record ParseResponse(String title, String assigneeHint, LocalDate dueDate,
                                Integer durationMinutes, Task.TaskPriority priority) {}

    @PostMapping("/parse-task")
    public ParseResponse parse(@RequestBody ParseRequest req) {
        // TODO: call ChatClient with structured-output schema; strip PII first.
        return new ParseResponse(req.sentence(), null, null, null, null);
    }
}
