package com.taskflow.auth;

import com.taskflow.common.error.ApiException;
import com.taskflow.config.AppProperties;
import com.taskflow.domain.User;
import com.taskflow.domain.Workspace;
import com.taskflow.domain.repo.UserRepository;
import com.taskflow.domain.repo.WorkspaceRepository;
import com.taskflow.security.JwtService;
import com.taskflow.security.RefreshTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** BRD §FR-1.* — signup, login, refresh, logout. */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository users;
    private final WorkspaceRepository workspaces;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refresh;
    private final AppProperties props;

    public AuthController(UserRepository users, WorkspaceRepository workspaces,
                          PasswordEncoder encoder, JwtService jwt,
                          RefreshTokenService refresh, AppProperties props) {
        this.users = users;
        this.workspaces = workspaces;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refresh = refresh;
        this.props = props;
    }

    public record SignupRequest(
        @Email @NotBlank @Size(max = 254) String email,
        @NotBlank @Size(min = 10, max = 200) String password,
        @NotBlank @Size(max = 60) String displayName
    ) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String accessToken, UserDto user) {}
    public record UserDto(UUID id, String email, String displayName) {
        public static UserDto from(User u) { return new UserDto(u.getId(), u.getEmail(), u.getDisplayName()); }
    }

    @PostMapping("/signup")
    @Transactional
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest req, HttpServletResponse res) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw new ApiException("EMAIL_EXISTS", "An account with this email already exists.", HttpStatus.CONFLICT);
        }
        if (!isPasswordStrong(req.password())) {
            throw new ApiException("WEAK_PASSWORD",
                "Password must be ≥ 10 chars with an uppercase, a digit, and a symbol.",
                HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
            .email(req.email())
            .passwordHash(encoder.encode(req.password() + props.bcrypt().pepper()))
            .displayName(req.displayName())
            .tokenVersion(0)
            .build();
        users.save(user);

        // Personal workspace per BRD §FR-1.1
        String slug = "ws-" + user.getId().toString().substring(0, 8);
        workspaces.save(Workspace.builder()
            .name(req.displayName() + "'s workspace")
            .slug(slug)
            .timezone("UTC")
            .build());

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(issueTokens(user, res));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
        var user = users.findByEmailIgnoreCase(req.email())
            .orElseThrow(() -> new ApiException("INVALID_CREDENTIALS", "Invalid email or password.", HttpStatus.UNAUTHORIZED));
        if (!encoder.matches(req.password() + props.bcrypt().pepper(), user.getPasswordHash())) {
            // Constant-time-ish: BCrypt match already handles timing.
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(issueTokens(user, res));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(HttpServletRequest req, HttpServletResponse res) {
        String token = readRefreshCookie(req)
            .orElseThrow(() -> new ApiException("NO_REFRESH", "Missing refresh token.", HttpStatus.UNAUTHORIZED));

        Claims claims;
        try { claims = jwt.verify(token); }
        catch (JwtException e) {
            throw new ApiException("INVALID_REFRESH", "Invalid refresh token.", HttpStatus.UNAUTHORIZED);
        }

        UUID userId = UUID.fromString(claims.getSubject());
        String jti = claims.getId();

        if (refresh.isBlacklisted(userId, jti)) {
            // Reuse detection — bump tokenVersion to invalidate ALL tokens.
            users.findById(userId).ifPresent(u -> {
                u.setTokenVersion(u.getTokenVersion() + 1);
                users.save(u);
            });
            throw new ApiException("REFRESH_REUSED", "Refresh token reuse detected. All sessions invalidated.", HttpStatus.UNAUTHORIZED);
        }

        var user = users.findById(userId)
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found.", HttpStatus.UNAUTHORIZED));
        if (claims.get("tokenVersion", Integer.class) != user.getTokenVersion()) {
            throw new ApiException("STALE_REFRESH", "Refresh token is stale.", HttpStatus.UNAUTHORIZED);
        }

        // Rotate
        refresh.blacklist(userId, jti, claims.getExpiration().toInstant());
        return ResponseEntity.ok(issueTokens(user, res));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse res) {
        readRefreshCookie(req).ifPresent(token -> {
            try {
                Claims c = jwt.verify(token);
                refresh.blacklist(UUID.fromString(c.getSubject()), c.getId(), c.getExpiration().toInstant());
            } catch (JwtException ignored) {}
        });
        clearRefreshCookie(res);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ────────────────────────────────────────────────────────
    private AuthResponse issueTokens(User user, HttpServletResponse res) {
        String access = jwt.mintAccess(user.getId(), user.getTokenVersion(), Map.of());
        var refreshToken = jwt.mintRefresh(user.getId(), user.getTokenVersion());
        refresh.register(user.getId(), refreshToken.jti(), refreshToken.expiresAt());
        writeRefreshCookie(res, refreshToken.token());
        return new AuthResponse(access, UserDto.from(user));
    }

    private void writeRefreshCookie(HttpServletResponse res, String token) {
        Cookie c = new Cookie("tf_refresh", token);
        c.setHttpOnly(true);
        c.setSecure(true);
        c.setPath("/api/v1/auth");
        c.setMaxAge((int) refresh.refreshTtlSeconds());
        c.setAttribute("SameSite", "Strict");
        res.addCookie(c);
    }

    private void clearRefreshCookie(HttpServletResponse res) {
        Cookie c = new Cookie("tf_refresh", "");
        c.setHttpOnly(true);
        c.setSecure(true);
        c.setPath("/api/v1/auth");
        c.setMaxAge(0);
        res.addCookie(c);
    }

    private java.util.Optional<String> readRefreshCookie(HttpServletRequest req) {
        if (req.getCookies() == null) return java.util.Optional.empty();
        for (Cookie c : req.getCookies()) {
            if ("tf_refresh".equals(c.getName())) return java.util.Optional.of(c.getValue());
        }
        return java.util.Optional.empty();
    }

    private static boolean isPasswordStrong(String p) {
        return p.length() >= 10
            && p.chars().anyMatch(Character::isUpperCase)
            && p.chars().anyMatch(Character::isDigit)
            && p.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
    }
}
