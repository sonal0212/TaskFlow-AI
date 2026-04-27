package com.taskflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "taskflow")
public record AppProperties(Jwt jwt, Bcrypt bcrypt, Cors cors) {
    public record Jwt(String issuer, String secret, long accessTtlSeconds, long refreshTtlSeconds) {}
    public record Bcrypt(String pepper) {}
    public record Cors(List<String> allowedOrigins) {}
}
