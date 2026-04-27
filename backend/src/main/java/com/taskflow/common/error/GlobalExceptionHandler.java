package com.taskflow.common.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/** Standard error envelope per BRD §11. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ErrorEnvelope(String code, String message, Map<String, Object> details) {}

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorEnvelope> handleApi(ApiException e) {
        return ResponseEntity.status(e.getStatus())
            .body(new ErrorEnvelope(e.getCode(), e.getMessage(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException e) {
        Map<String, Object> details = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fe ->
            details.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.badRequest()
            .body(new ErrorEnvelope("VALIDATION_FAILED", "One or more fields are invalid.", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorEnvelope> handleConstraint(ConstraintViolationException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorEnvelope("VALIDATION_FAILED", e.getMessage(), Map.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorEnvelope> handleAny(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorEnvelope("INTERNAL_ERROR", "Something went wrong.", Map.of()));
    }
}
