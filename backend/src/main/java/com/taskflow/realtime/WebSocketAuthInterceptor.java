package com.taskflow.realtime;

import com.taskflow.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

/** Validates the JWT carried on STOMP CONNECT and binds principal — BRD §9.4. */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwt;

    public WebSocketAuthInterceptor(JwtService jwt) { this.jwt = jwt; }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                Claims claims = jwt.verify(authHeader.substring(7));
                accessor.setUser(new StompPrincipal(claims.getSubject()));
            }
        }
        return message;
    }

    private record StompPrincipal(String name) implements Principal {
        @Override public String getName() { return name; }
    }
}
