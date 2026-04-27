package com.taskflow.security;

import com.taskflow.config.AppProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Refresh-token store backed by Redis (BRD §9.6).
 *
 *   refresh:{jti}     hash {userId, exp}      TTL 7 d
 *   blacklist:{userId} set  {jti,...}         TTL 7 d
 *
 * On every refresh:
 *   1. Verify signature + expiry (caller does this via JwtService).
 *   2. If jti is in blacklist → token re-use → bump tokenVersion (caller).
 *   3. Else add jti to blacklist, mint a new pair, store the new jti.
 */
@Service
public class RefreshTokenService {

    private final StringRedisTemplate redis;
    private final AppProperties props;

    public RefreshTokenService(StringRedisTemplate redis, AppProperties props) {
        this.redis = redis;
        this.props = props;
    }

    public void register(UUID userId, String jti, Instant expiresAt) {
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        redis.opsForHash().put("refresh:" + jti, "userId", userId.toString());
        redis.opsForHash().put("refresh:" + jti, "exp", Long.toString(expiresAt.getEpochSecond()));
        redis.expire("refresh:" + jti, ttl);
    }

    public boolean isBlacklisted(UUID userId, String jti) {
        Boolean member = redis.opsForSet().isMember("blacklist:" + userId, jti);
        return Boolean.TRUE.equals(member);
    }

    public void blacklist(UUID userId, String jti, Instant expiresAt) {
        redis.opsForSet().add("blacklist:" + userId, jti);
        redis.expire("blacklist:" + userId, Duration.between(Instant.now(), expiresAt));
        redis.delete("refresh:" + jti);
    }

    public long refreshTtlSeconds() { return props.jwt().refreshTtlSeconds(); }
}
