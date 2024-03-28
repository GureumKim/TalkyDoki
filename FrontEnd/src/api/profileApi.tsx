import {
  PasswordChangeParams,
  ProfileUpdateParams,
} from "@/interface/AuthInterface";
import { UserKeywordInterface } from "@/interface/UserInterface";
import { useSetISModalOn, useSetModalContent } from "@/stores/modalStore";
import { useSetPasswordErrors } from "@/stores/signUpStore";
import { customAxios } from "@/util/auth/customAxios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// 이미지 업로드
export const useUploadImageFile = () => {
  return useMutation({
    mutationFn: (payload: FormData) =>
      customAxios.post("/firebase/upload", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: () => console.log("이미지 업로드 완료"),
  });
};

// 프로필 업데이트
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setModalContent = useSetModalContent();
  const setIsModalOn = useSetISModalOn();

  return useMutation({
    mutationFn: (payload: ProfileUpdateParams) =>
      customAxios.patch("/member/update", payload, {}),
    onSuccess: ({ data }) => {
      if (data.dataHeader.successCode == 0) {
        setModalContent({
          message: "프로필이 저장되었습니다.",
          isInfo: true,
          isReadOnly: true,
        });
        navigate("/mypage");
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["getMember"] });
          setIsModalOn(false);
        }, 800);
      } else {
        console.log(data.dataHeader.resultMessage);
        setIsModalOn(false);
      }
    },
  });
};

// 비밀번호 변경 mutation
export const usePasswordChange = () => {
  const setPasswordErrors = useSetPasswordErrors();
  const setModalContent = useSetModalContent();
  const setIsModalOn = useSetISModalOn();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: PasswordChangeParams) =>
      customAxios.patch("member/password/change", payload),

    onSuccess: ({ data }) => {
      const { dataHeader } = data;

      // 성공 시
      if (dataHeader.successCode == 0) {
        setModalContent({
          message: "변경이 완료되었습니다.",
          isInfo: true,
        });
        setIsModalOn(true);
        navigate("/mypage");

        // 실패 시
      } else if (dataHeader.successCode == 1) {
        // result Code가 없을 경우 모달 출력
        if (!dataHeader.resultCode) {
          setModalContent({
            message: dataHeader.resultMessage,
            isInfo: true,
          });
          setIsModalOn(true);
        } else {
          // 있을 경우 (validError)
          setPasswordErrors({ ...dataHeader.resultMessage });
        }
      }
    },
  });
};

// 사용자 키워드 불러오는 hook
export const useUserKeyword = () => {
  return useQuery({
    queryKey: ["userKeywords"],
    queryFn: () => customAxios.get("/keywords/member"),
    select: ({ data }) => {
      if (data.dataHeader.successCode == 0) {
        return data.dataBody as UserKeywordInterface[];
      } else {
        return [] as UserKeywordInterface[];
      }
    },
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60, // 1시간
  });
};
