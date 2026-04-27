package com.taskflow.realtime;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * BRD §9.4 — Outbox publisher.
 * Polls the event_outbox table every 200 ms, publishes pending rows over STOMP,
 * and marks them published. Idempotent by event id.
 *
 * Stub implementation; wire to a JdbcTemplate-backed outbox repo next.
 */
@Component
public class EventOutboxPublisher {

    private final SimpMessagingTemplate broker;

    public EventOutboxPublisher(SimpMessagingTemplate broker) {
        this.broker = broker;
    }

    @Scheduled(fixedDelay = 200)
    public void publishPending() {
        // TODO: SELECT * FROM event_outbox WHERE published_at IS NULL ORDER BY id LIMIT 100
        //       broker.convertAndSend(row.topic(), row.payload());
        //       UPDATE event_outbox SET published_at = now() WHERE id = ?
    }
}
