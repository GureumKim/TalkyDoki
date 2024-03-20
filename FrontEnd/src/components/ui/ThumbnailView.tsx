import { useIsMobile } from "@/stores/displayStore";
import { ThumbnailViewWrapper } from "@/styles/common/ui/thumbnailview";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
};

// 마우스를 움직이면 이미지가 넘어가는 컨테이너

function ThumbnailView({ images }: Props) {
  const [now, setNow] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // 마우스 이동 인식 함수
  const detectMouse = (e: MouseEvent) => {
    if (!thumbnailRef.current) return;
    const oneSection = thumbnailRef.current.offsetWidth / images.length;
    const direction = Math.floor(e.offsetX / oneSection);

    if (now != direction) {
      setNow(() => {
        if (direction >= images.length) {
          return images.length - 1;
        } else if (direction < 0) {
          return 0;
        } else {
          return direction;
        }
      });
    }
  };

  useEffect(() => {
    if (isMobile) return;
    if (images.length == 1) return;
    if (!thumbnailRef.current) return;
    thumbnailRef.current.addEventListener("mousemove", detectMouse);

    return () => {
      if (!thumbnailRef.current) return;
      thumbnailRef.current.removeEventListener("mousemove", detectMouse);
    };
  }, [now, isMobile]);

  return (
    <ThumbnailViewWrapper
      $length={images.length}
      $isMobile={isMobile}
      ref={thumbnailRef}
    >
      {/* 아래 점 */}
      {images.length > 1 && (
        <div className="navigator">
          {[...Array(images.length)].map((each, idx) => (
            <div key={idx} className={`dot ${now === idx && `selected`}`} />
          ))}
        </div>
      )}
      {/* 이미지 */}
      <div className="track">
        {images.map((each, idx) => (
          <img
            key={idx}
            src={each}
            alt="이미지"
            style={{ transform: `translateX(-${100 * now}%)` }}
          />
        ))}
      </div>
    </ThumbnailViewWrapper>
  );
}

export default ThumbnailView;
