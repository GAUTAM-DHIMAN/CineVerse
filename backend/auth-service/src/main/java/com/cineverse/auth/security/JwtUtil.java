package com.cineverse.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {
    private final Key key = Keys.hmacShaKeyFor("changeit-changeit-changeit-changeit-123456".getBytes());

    public String generateToken(String subject){
        return Jwts.builder().setSubject(subject).setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis()+86400000))
                .signWith(key).compact();
    }

    public String validateTokenAndGetSubject(String token){
        Jws<Claims> claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
        return claims.getBody().getSubject();
    }
}
