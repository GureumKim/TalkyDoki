import styled, { keyframes } from "styled-components";

export const MainSession = styled.section`
  transition: transform 0.5s ease;
  width: 100%;
  height: 79%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 0;
  @media screen and (max-width: 992px) {
    height: 85vh;
  }
  position: relative;
`;

export const ChatRoomContainer = styled(Card)`
  width: 100%;
  height: 98%;
  display: flex;
  flex-direction: column;
  padding: 0;
  justify-content: space-between;
`;

export const HeaderContainer = styled.div`
  height: 9%;
  padding: 3vh 3vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const MainContainer = styled.div`
  border-top: 3px solid var(--shadow);
  border-bottom: 3px solid var(--shadow);
  height: 79%;
  background: var(--shadow);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 3vw;
  font-size: 0.8125rem;

  .messageContainer {
    transition: opacity 0.6s ease-in-out, max-height 0.5s ease-in-out;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }

  .messageContainer.isVisible {
    opacity: 1;
    max-height: 100px;
  }

  .message-item.chatbot {
    align-self: flex-start;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    max-width: 60%;
    margin-bottom: 30px;

    .chatbot-icon-container {
      align-self: self-start;
      width: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 10px;
    }
    .chatbot-icon {
      width: 50px;
    }
    .buttonbox {
      margin: 5px 0;
      width: 40px;
      display: flex;
      justify-content: space-between;
    }
    .message-item.chat {
      display: flex;
      flex-direction: column;
      width: calc(100%-px);
      padding: 10px;
      background: var(--bg-modal);
      color: var(--text);
      max-width: 100%;
      align-self: flex-end;
      border-radius: 5px;
      box-shadow: 0px 1px 5px 3px var(--shadow);
    }
  }

  .buttonbox {
    margin: 5px 0;
    width: 40px;
    display: flex;
    justify-content: space-between;
  }
  .message-item.self {
    padding: 10px;
    margin-bottom: 30px;
    background: var(--bg-modal);
    max-width: 60%;
    background-color: var(--main);
    align-self: flex-end;
    border-radius: 5px;
    box-shadow: 0px 1px 5px 3px var(--shadow);
    .message-text {
      color: var(--text-button);
    }
    .buttonbox {
      color: var(--text-button);
    }
    .messageContainer {
      color: var(--text-button);
    }
  }
`;

// 녹음중 애니메이션
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.16);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const FooterContainer = styled.div`
  width: 100%;
  height: 12%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  .cancel-icon {
    position: absolute;
    left: 42.5%;
    cursor: pointer;
    @media screen and (max-width: 992px) {
      left: 38%;
    }
  }
  .micdiv {
    border-radius: 50%;
    width: 3.8rem;
    height: 3.8rem;
    background: linear-gradient(180deg, #6744f3 0%, #957df8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    &:hover {
      background: linear-gradient(180deg, #89abe3ff 0%, #b6d0e2ff 100%);
    }
    @media screen and (max-width: 992px) {
      width: 45px;
      height: 45px;
    }
    &.recording {
      animation: ${pulse} 1.5s infinite;
    }
  }
  .transcriptdiv {
    position: absolute;
    bottom: 430%;
  }
  .reportdiv {
    font-family: "Mplus";
    font-weight: 700;
    position: absolute;
    right: 2%;
  }
`;

const fadeInUp = keyframes`
    from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }

`;

export const ChatTipContainer = styled.div`
  position: absolute;
  width: 60%;
  left: 20%;
  top: 60%;
  border-radius: 10px;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  align-items: center;
  background-color: ${(props) =>
    props.theme.mode == "light" ? "var(--grey-light)" : "var(--shadow-dark)"};
  padding: 15px 30px;
  min-height: 5px; // 최소 높이 설정
  //애니메이션 추가
  animation: ${fadeInUp} 2s ease-out;
  &.isVisible {
    animation: ${fadeInUp} 2s ease-out;
  }
  z-index: 2;
  &.isBehind {
    z-index: 0; // 뒤로 보내기
    opacity: 0.2; // 투명도 조절
  }
  .message {
    align-self: flex-start;
    font-size: 15px;
    margin-bottom: 5px;
  }
  .message-record {
    align-self: flex-start;
    font-family: "ScoreDream";
    font-weight: 500;
    font-size: 15px;
    margin-bottom: 5px;
    @media screen and (max-width: 992px) {
      font-size: 12px;
    }
  }
  .message-suggest {
    font-family: "Mplus";
    align-self: flex-start;
    color: var(--blue);
    font-size: 12px;
    font-weight: 700;
    @media screen and (max-width: 992px) {
      font-size: 9px;
    }
  }
  .message-text {
    font-family: "Mplus";
    align-self: flex-start;
    color: var(--grey-dark);
    font-size: 14px;
    @media screen and (max-width: 992px) {
      font-size: 11px;
    }
  }
  @media screen and (max-width: 992px) {
    top: 58%;
  }
  .volume-box {
    align-self: self-start;
  }
`;
