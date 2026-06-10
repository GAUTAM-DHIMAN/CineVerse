package com.cineverse.auth.controller;

import com.cineverse.auth.model.User;
import com.cineverse.auth.repository.UserRepository;
import com.cineverse.auth.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtUtil jwtUtil = new JwtUtil();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User u){
        u.setPassword(passwordEncoder.encode(u.getPassword()));
        u.setCreatedAt(OffsetDateTime.now());
        userRepository.save(u);
        return ResponseEntity.ok("registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User u){
        User user = userRepository.findByEmail(u.getEmail());
        if(user==null) return ResponseEntity.status(401).body("invalid");
        if(!passwordEncoder.matches(u.getPassword(), user.getPassword())) return ResponseEntity.status(401).body("invalid");
        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(java.util.Map.of("token", token));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(@RequestHeader(name="Authorization", required=false) String auth){
        if(auth==null || !auth.startsWith("Bearer ")) return ResponseEntity.status(401).build();
        String token = auth.substring(7);
        String username = jwtUtil.validateTokenAndGetSubject(token);
        User user = userRepository.findByUsername(username);
        if(user==null) return ResponseEntity.status(404).build();
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
