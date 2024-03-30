import React, { useState } from "react";
import { FooterContainer } from "@/styles/Aichat/AiChatRoom";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import MicIcon from "@mui/icons-material/Mic";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { BlueButton } from "@/styles/common/ui/button";
import { useNavigate } from "react-router-dom";
import { getCookie } from "@/util/auth/userCookie";
import { useReportCreate, useSendMessage } from "@/api/chatApi";
import { getStompClient } from "@/util/websocket/stompConnection";
import { BeatLoader } from "react-spinners";
import { useSetISModalOn, useSetModalContent } from "@/stores/modalStore";
import Loading from "@/components/ui/Loading";

interface ChatFooterProps {
  roomId: string | undefined;
}

const ChatFooter: React.FC<ChatFooterProps> = ({ roomId }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const navigate = useNavigate();
  console.log("transcript", transcript);
  //로딩 추가
  const [isLoading, setIsLoading] = useState(false);

  // 타이머
  const [timer, setTimer] = useState<number | undefined>(undefined);
  console.log("시각화 확인 콘솔:isRecording", isRecording);

  const [chatText, setChatText] = useState<string>("");
  const { mutate: sendChatMessage } = useSendMessage();

  // 레포트 작성 모달추가
  const setModalContent = useSetModalContent();
  const setIsModalOn = useSetISModalOn();
  const { mutate: reportCreate } = useReportCreate();

  const handleReportModal = () => {
    setModalContent({
      message: "리포트를 저장하시겠습니까??",
      onSuccess: () => {
        setIsLoading(true);
        reportCreate(roomId, {
          onSuccess: ({
            data: {
              dataBody: { reportId },
            },
          }) => {
            console.log("리포트 아이디", reportId);
            setIsLoading(false);
            setIsModalOn(false);
            navigate(`/aichatreport/${reportId}`);
          },
          onError: () => {
            setIsModalOn(false);

            navigate("/aichatlist");
          },
        });
      },

      isInfo: false,
    });
    setIsModalOn(true);
  };

  const sendMessage = (text = chatText) => {
    console.log("메세지 전송");
    const token = getCookie();
    if (text.trim() !== "") {
      const message = {
        sender: "USER",
        japanese: text,
        korean: null,
      };

      const sendpayload = {
        roomId: roomId ?? "",
        data: message,
      };

      getStompClient()?.send(
        `/pub/ai/chat/user/${roomId}`,
        JSON.stringify(message),
        {
          Authorization: `Bearer ${token}`,
        }
      );

      sendChatMessage(sendpayload);

      console.log("보낸메세지~~~", message);

      setChatText("");
    }
  };

  // 레코딩취소
  const cancelRecording = () => {
    SpeechRecognition.stopListening();

    setIsRecording(false);
    resetTranscript();
    clearTimeout(timer);
    // SpeechRecognition.abortListening();
  };

  const toggleRecording = () => {
    // 음성 인식을 중지하는 경우
    if (isRecording) {
      SpeechRecognition.stopListening();

      sendMessage(transcript);
      resetTranscript(); // 인식된 텍스트 초기화

      setIsRecording(false); // 음성 인식 상태 업데이트
      clearTimeout(timer); // 이전 타이머가 있다면 취소
    } else {
      // 음성 인식을 시작하기 전에 이전 타이머가 있다면 취소
      if (timer) {
        clearTimeout(timer);
      }
      resetTranscript(); // 인식된 텍스트 초기화

      SpeechRecognition.startListening({ continuous: true, language: "ja-JP" });

      // 새로운 타이머 설정
      const newTimer = window.setTimeout(() => {
        SpeechRecognition.stopListening();
        resetTranscript();
        setIsRecording(false);
      }, 17000);

      // 새 타이머 상태 업데이트
      setTimer(newTimer as unknown as number);
      setIsRecording(true);
    }
  };

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return <span>크롬 브라우저를 사용해주세요.</span>;
  }

  if (isLoading) {
    return <Loading />;
  }
  return (
    <FooterContainer>
      {isRecording && (
        <div className="cancel-icon" onClick={cancelRecording}>
          <HighlightOffIcon
            style={{
              fontSize: "2.2rem",
              color: "#DC143C",
              marginRight: "10px",
            }}
          />
        </div>
      )}
      {isRecording && (
        <div className="transcriptdiv">
          {transcript ? <p>{transcript}</p> : <BeatLoader />}
        </div>
      )}

      <div
        className={`micdiv ${isRecording ? "recording" : ""}`}
        onClick={toggleRecording}
      >
        <MicIcon style={{ fontSize: "2.5rem", color: "#FFFFFF" }} />
      </div>
      <div className="reportdiv">
        <BlueButton
          width="95px"
          height="33px"
          onClick={() => handleReportModal()}
        >
          리포트 작성
        </BlueButton>
      </div>
    </FooterContainer>
  );
};

export default ChatFooter;
