// import { useState } from "react";
import { useGetArticle } from "@/api/newsApi";
import { useLocation } from "react-router-dom";
import {
  NewsArticleWrapper,
  NewsWrapper,
} from "@/styles/News/Detail/container";
import ArticleRead from "@/components/News/Detail/ArticleRead";
import SideWidget from "@/components/News/Detail/SideWidget";
import TitleSection from "@/components/News/Detail/TitleSection";
import WordSearch from "@/components/News/Detail/ui/WordSearch";
import { useIsSearchOn } from "@/stores/newsStore";

type Props = {};

function NewsDetail({}: Props) {
  const { state } = useLocation();
  const newsId = state.newsId;
  // const [isReadMode, setIsReadMode] = useState(true);
  const { data, isFetching } = useGetArticle(newsId);

  if (isFetching || !data) return <></>;

  return (
    <NewsWrapper>
      <WordSearch />
      <NewsArticleWrapper>
        <TitleSection
          title={data.fullTitle}
          url={data.srcOrigin}
          date={data.writeDate}
          images={data.newsImages}
        />
        <ArticleRead
          newsId={newsId}
          news={data.content}
          korNews={data.contentTranslated}
          summary={data.summary}
          korSummary={data.summaryTranslated}
          fullNews={data.fullNews}
        />
      </NewsArticleWrapper>
      <SideWidget />
    </NewsWrapper>
  );
}

export default NewsDetail;
