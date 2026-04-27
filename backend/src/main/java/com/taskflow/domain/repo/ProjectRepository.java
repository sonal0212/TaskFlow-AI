package com.taskflow.domain.repo;

import com.taskflow.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findAllByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
