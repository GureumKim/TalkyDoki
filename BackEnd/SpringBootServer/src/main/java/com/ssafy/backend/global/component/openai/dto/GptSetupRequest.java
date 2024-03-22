package com.ssafy.backend.global.component.openai.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.ssafy.backend.domain.aichat.entity.enums.AiChatCategory;

import java.util.List;
import java.util.Map;

/**
 * GPT와의 대화 요청을 나타내는 레코드입니다.
 * 이 레코드는 GPT 모델에 전송될 메시지와 관련 설정을 포함합니다.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record GptSetupRequest(
        String model,
        List<GptDialogueMessage> messages,
        int maxTokens,
        double temperature,
        Map<String ,Object> responseFormat
) {
    /**
     * 특정 카테고리에 맞는 GPT 대화 설정을 생성합니다.
     *
     * @param category 설정할 대화의 카테고리
     * @return GptSetupRequest GPT 설정 요청 객체
     */
    public static GptSetupRequest from(AiChatCategory category) {
        String jsonString = "{"
                + "\"conversation_${주고받은 순서}\": {"
                + "    \"gpt_japanese\": \"${너의 대답 (일본어)}\","
                + "    \"gpt_korean\": \"${너의 대답 한국어 번역}\","
                + "    \"user_tip_japanese\": \"${사용자의 모범 답변 (일본어)}。\""
                + "    \"user_tip_korean\": \"${사용자의 모범 답변 한국어 번역}。\""
                + "  }"
                + "}";

        // 카테고리에 따른 대화 설정 로직 구현
        String systemMessage = "이제부터 GPT 너는 일본어 회화 전문 강사야.\n" +
                "해당 회화 주제에 맞는 것에 따라 그 주제에 맞는 회화 답변을 반드시 먼저 일본어로 해줘.\n" +
                "제공되는 대화를 반드시 일본어로 상황에 맞게 계속 이어나가 줘. 전체 대화를 이해하고, " +
                "사용자의 응답에 반드시 일본어로 답해줘.\n" +
                "답변은 너의 대답, 그리고 너의 응답에 대한 상대방의 모범 답변을 제시해주면 돼.\n" +
                "주제는 " + category.getKoreanName() + " 이거야.\n" +
                "표현 형식 다음과 같아. 반드시 다음 양식에 맞게 회화 답변을 생성해줘.\n" +
                jsonString +
                "이런식으로 JSON format으로 data 전송해줘";    // JSON format 필수로 있어야함

        // 카테고리에 따른 대화 설정 로직 구현
        List<GptDialogueMessage> messages = List.of(
                new GptDialogueMessage("system", systemMessage)
        );

        Map<String, Object> responseFormat = Map.of("type", "json_object"); // JSON 형식을 지정

        return new GptSetupRequest(
                "gpt-3.5-turbo-1106",
                messages,
                300,
                0.7,
                responseFormat
        );
    }
}
