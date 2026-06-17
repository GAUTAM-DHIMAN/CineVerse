package com.cineverse.auth.controller;

import com.cineverse.auth.dto.*;
import com.cineverse.auth.model.User;
import com.cineverse.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for authentication endpoints.
 * All responses use the standardized ApiResponse format.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /auth/register — Register a new user.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        Map<String, Object> data = Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", data));
    }

    /**
     * POST /auth/login — Authenticate and receive a JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> tokenData = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", tokenData));
    }

    /**
     * GET /auth/logout — Stateless logout (client should discard the token).
     */
    @GetMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // In a stateless JWT setup, logout is handled client-side.
        // A production implementation would blacklist the token in Redis.
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully. Please discard your token."));
    }

    /**
     * POST /auth/forgot-password — Generate a password reset token.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String resetToken = authService.forgotPassword(request);
        // In production, the token would be sent via email — not in the response.
        Map<String, String> data = Map.of("resetToken", resetToken);
        return ResponseEntity.ok(ApiResponse.success("Password reset token generated", data));
    }

    /**
     * POST /auth/reset-password — Reset password using a valid token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful"));
    }

    /**
     * GET /auth/profile — Get the authenticated user's profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> profile(Authentication authentication) {
        String email = authentication.getName();
        User user = authService.getProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", user));
    }
}
