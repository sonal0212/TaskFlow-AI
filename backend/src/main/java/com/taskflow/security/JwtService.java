package com.taskflow.security;

import com.taskflow.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/** JWT minting + verification — BRD §9.6 (HS256, 15 min access, 7 d refresh, jti, tokenVersion). */
@Service
public class JwtService {

    private final AppProperties props;
    private final SecretKey key;

    public JwtService(AppProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.jwt().secret().getBytes(StandardCharsets.UTF_8));
    }

    public String mintAccess(UUID userId, int tokenVersion, Map<String, Object> extraClaims) {
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(props.jwt().issuer())
            .subject(userId.toString())
            .id(UUID.randomUUID().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(props.jwt().accessTtlSeconds())))
            .claim("tokenVersion", tokenVersion)
            .claims(extraClaims)
            .signWith(key)
            .compact();
    }

    public RefreshToken mintRefresh(UUID userId, int tokenVersion) {
        Instant now = Instant.now();
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
            .issuer(props.jwt().issuer())
            .subject(userId.toString())
            .id(jti)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(props.jwt().refreshTtlSeconds())))
            .claim("tokenVersion", tokenVersion)
            .claim("type", "refresh")
            .signWith(key)
            .compact();
        return new RefreshToken(token, jti, now.plusSeconds(props.jwt().refreshTtlSeconds()));
    }

    public Claims verify(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public record RefreshToken(String token, String jti, Instant expiresAt) {}
}
