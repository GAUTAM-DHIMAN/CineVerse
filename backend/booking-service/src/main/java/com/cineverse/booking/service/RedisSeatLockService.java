package com.cineverse.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * Redis-based distributed seat locking service.
 * Uses Redis SET NX with TTL for atomic lock acquisition.
 * 5-minute TTL auto-expires locks without requiring a scheduler.
 */
@Service
public class RedisSeatLockService {

    private static final Logger log = LoggerFactory.getLogger(RedisSeatLockService.class);
    private static final String SEAT_LOCK_PREFIX = "seat:lock:";
    private static final Duration LOCK_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisSeatLockService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Attempt to lock a seat for a user. Uses SET NX (set if not exists) with TTL.
     * @return true if lock acquired, false if seat already locked by another user
     */
    public boolean lockSeat(Long showId, Long seatId, String userId) {
        String key = buildKey(showId, seatId);
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(key, userId, LOCK_TTL);
        if (Boolean.TRUE.equals(acquired)) {
            log.info("Seat lock acquired: show={}, seat={}, user={}", showId, seatId, userId);
            return true;
        }
        log.warn("Seat lock DENIED: show={}, seat={}, user={} (already locked)", showId, seatId, userId);
        return false;
    }

    /**
     * Attempt to lock multiple seats atomically.
     * If any seat fails to lock, all previously locked seats are released.
     * @return true if ALL seats locked successfully
     */
    public boolean lockSeats(Long showId, List<Long> seatIds, String userId) {
        // Try to lock all seats
        int lockedCount = 0;
        for (Long seatId : seatIds) {
            if (lockSeat(showId, seatId, userId)) {
                lockedCount++;
            } else {
                // Rollback: release all previously locked seats
                for (int i = 0; i < lockedCount; i++) {
                    releaseSeat(showId, seatIds.get(i), userId);
                }
                return false;
            }
        }
        return true;
    }

    /**
     * Release a seat lock (only if the current user holds it).
     */
    public void releaseSeat(Long showId, Long seatId, String userId) {
        String key = buildKey(showId, seatId);
        Object holder = redisTemplate.opsForValue().get(key);
        if (userId.equals(holder)) {
            redisTemplate.delete(key);
            log.info("Seat lock released: show={}, seat={}, user={}", showId, seatId, userId);
        }
    }

    /**
     * Release all seats for a booking.
     */
    public void releaseSeats(Long showId, List<Long> seatIds, String userId) {
        for (Long seatId : seatIds) {
            releaseSeat(showId, seatId, userId);
        }
    }

    /**
     * Check if a seat is currently locked.
     */
    public boolean isSeatLocked(Long showId, Long seatId) {
        String key = buildKey(showId, seatId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Get the user who holds the lock on a seat.
     */
    public String getLockHolder(Long showId, Long seatId) {
        String key = buildKey(showId, seatId);
        Object holder = redisTemplate.opsForValue().get(key);
        return holder != null ? holder.toString() : null;
    }

    private String buildKey(Long showId, Long seatId) {
        return SEAT_LOCK_PREFIX + showId + ":" + seatId;
    }
}
