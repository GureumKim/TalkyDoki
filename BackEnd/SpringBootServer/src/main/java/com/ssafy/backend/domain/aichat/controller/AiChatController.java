package com.ssafy.backend.domain.aichat.controller;


import com.ssafy.backend.domain.aichat.dto.AiChatMessage;
import com.ssafy.backend.domain.aichat.dto.AiChatRoomCreateResponse;
import com.ssafy.backend.domain.aichat.entity.enums.AiChatCategory;
import com.ssafy.backend.domain.aichat.service.AiChatService;
import com.ssafy.backend.global.common.dto.Message;
import com.ssafy.backend.global.component.jwt.security.MemberLoginActive;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;

@Tag(name = "Ai Chatting", description = "AiChatting 관련 API 입니다.")
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ai/chat")
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/room/create/{category}")
    @PreAuthorize("hasAuthority('USER') or hasAuthority('ADMIN')")
    public ResponseEntity<Message<AiChatRoomCreateResponse>> creatAiChatRoom(@AuthenticationPrincipal MemberLoginActive loginActive,
                                                                             @PathVariable AiChatCategory category) {
        AiChatRoomCreateResponse createResponse = aiChatService.creatAiChatRoom(loginActive.id(), category);
        return ResponseEntity.ok().body(Message.success(createResponse));
    }

    @MessageMapping("/ai/chat/user/{roomId}")
    public void sendAiChatMessageByUser(Principal principal, AiChatMessage aiChatMessage, @DestinationVariable Long roomId) {
        aiChatService.sendAiChatMessageByUser(Long.valueOf(principal.getName()), roomId, aiChatMessage);
    }

    @PostMapping("/gpt/{roomId}")
    public Mono<ResponseEntity<Message<Void>>> sendAiChatMessageByGpt(@PathVariable Long roomId,
                                                                      @RequestBody AiChatMessage userMessage) {
        return aiChatService.sendAiChatMessageByGpt(roomId, userMessage)
                .thenReturn(ResponseEntity.ok().body(Message.success()));
    }
}


