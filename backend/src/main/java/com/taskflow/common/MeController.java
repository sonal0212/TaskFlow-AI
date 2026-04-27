package com.taskflow.common;

import com.taskflow.common.error.ApiException;
import com.taskflow.domain.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MeController {

    private final UserRepository users;

    public MeController(UserRepository users) { this.users = users; }

    public record MeDto(UUID id, String email, String displayName) {}

    @GetMapping("/me")
    public MeDto me(@AuthenticationPrincipal String userId) {
        var u = users.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found.", HttpStatus.NOT_FOUND));
        return new MeDto(u.getId(), u.getEmail(), u.getDisplayName());
    }
}
