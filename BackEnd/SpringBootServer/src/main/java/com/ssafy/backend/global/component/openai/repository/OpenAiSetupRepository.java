package com.ssafy.backend.global.component.openai.repository;


import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;
import com.ssafy.backend.global.component.openai.dto.GptSetupRequest;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * AiChatSetupRepository는 AI 채팅봇 설정을 관리하는 데 사용됩니다.
 * 이 클래스는 Redis를 사용하여 설정을 저장, 조회하는 기능을 제공합니다.
 */
@Repository
@RequiredArgsConstructor
public class OpenAiSetupRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "openAiSetup::";

    private static final int EXPIRES_MIN = 30;	// 해당 채팅 제한시간 30분

    /**
     * 주어진 roomId와 GptSetupRequest를 Redis에 저장합니다.
     *
     * @param roomId 채팅방 ID, Redis에 저장될 키의 일부로 사용됩니다.
     * @param setupRequest GptSetupRequest 객체, Redis에 값으로 저장됩니다.
     */
    public void save(Long roomId, GptSetupRequest setupRequest) {
        String key = KEY_PREFIX + roomId;
        redisTemplate.opsForValue().set(key, setupRequest);
        redisTemplate.expire(key, EXPIRES_MIN, TimeUnit.MINUTES);
    }

    /**
     * 주어진 roomId에 해당하는 GptSetupRequest를 조회합니다.
     *
     * @param roomId 채팅방 ID, 조회할 키를 결정하는 데 사용됩니다.
     * @return Optional<GptSetupRequest> 조회된 GptSetupRequest. 설정이 존재하지 않을 경우 Optional.empty() 반환.
     */
    public Optional<GptSetupRequest> find(Long roomId) {
        GptSetupRequest setupRequest = (GptSetupRequest) redisTemplate.opsForValue().get(KEY_PREFIX + roomId);
        return Optional.ofNullable(setupRequest);
    }
}
