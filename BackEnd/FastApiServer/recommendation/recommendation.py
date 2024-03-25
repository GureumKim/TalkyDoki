from fastapi import HTTPException, APIRouter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from models.member import Member
from models.news import News
from models.keyword import Keyword
from models.news_keyword_mapping import NewsKeywordMapping
from models.news_keyword_history import NewsKeywordHistory
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta
from collections import Counter

import numpy as np
import pandas as pd
import pytz

# import torch
# import torch.nn as nntimedelta
# import torch.nn.functional as F
# import torch.optim as optim
# from torch.utils.data import DataLoader
# from datetime import datetime
# from torch.utils.data import Dataset
# from pydantic import BaseModel

router = APIRouter()

class DataStorage:
    def __init__(self, database_url="mysql+pymysql://ssafy:ssafy@j10c107.p.ssafy.io/talkydoki"):
        self.engine = create_engine(database_url)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.load_data()

    def load_data(self):
        kst = pytz.timezone('Asia/Seoul')
        now_kst = datetime.now(kst)
        three_days_ago_kst = now_kst - timedelta(days=3)
        
        # 한국 시간 기준 3일 이내의 뉴스 데이터만 쿼리
        # articles = self.session.query(News).filter(News.write_date >= three_days_ago_kst).all()
        
        articles = self.session.query(News).all()
        users = self.session.query(Member).all()
        keywords = self.session.query(Keyword).all()
        mappings = self.session.query(NewsKeywordMapping).all()
        # mappings = self.session.query(NewsKeywordMapping).join(NewsKeywordMapping.news).filter(News.write_date >= three_days_ago_kst).all()

        categories = ['SOCIETY', 'BUSINESS', 'POLITICS', 'SCIENCE_CULTURE', 'INTERNATIONAL', 'SPORTS', 'LIFE', 'WEATHER_DISASTER']
        category_kr = ['사회', '경제', '정치', '과학', '국제', '스포츠', '생활', '재난/날씨']
        category_map = dict(zip(categories, category_kr))
        self.categories = categories

        self.users = [user.id for user in users]
        self.articles = [f"{category_map[article.category]}기사{article.id}" for article in articles]
        self.words = {keyword.id: {'word': keyword.japanese, 'categories': []} for keyword in keywords}

        for mapping in mappings:
            if mapping.keyword.id in self.words:
                news_category = category_map[mapping.news.category]
                if news_category not in self.words[mapping.keyword.id]['categories']:
                    self.words[mapping.keyword.id]['categories'].append(news_category)

        article_word_data = {}
        for mapping in mappings:
            article_key = f"{category_map[mapping.news.category]}기사{mapping.news.id}"
            word_id = mapping.keyword.id
            if article_key in article_word_data:
                article_word_data[article_key][word_id] = mapping.weight
            else:
                article_word_data[article_key] = {word_id: mapping.weight}

        self.article_word_df = pd.DataFrame(0, index=self.articles, columns=self.words.keys())
        self.user_word_df = pd.DataFrame(0, index=self.users, columns=self.words.keys())
        self.article_word_df.to_csv("article_word_df.csv", encoding="utf-8-sig")
        self.user_word_df.to_csv("user_word_df.csv", encoding="utf-8-sig")

        for article, word_ids in article_word_data.items():
            for word_id, weight in word_ids.items():
                if word_id in self.article_word_df.columns:
                    self.article_word_df.at[article, word_id] = weight

        individual_preferences = {
            1: '사회',
            2: '경제',
            3: '정치',
            4: '과학',
            5: '국제',
            6: '스포츠'
        }
        
        for user in self.users:
            if user in individual_preferences:
                preferred_category = individual_preferences[user]
            else:
                # 나머지 유저들에 대한 선호 카테고리 설정
                preferred_category_index = (user - len(individual_preferences) - 1) % len(self.categories)
                preferred_category = self.categories[preferred_category_index]
                preferred_category = category_map[preferred_category]
            
            # 선호하는 카테고리의 키워드 ID와 비선호 카테고리의 키워드 ID를 분류
            preferred_words = [word_id for word_id, info in self.words.items() if preferred_category in info['categories']]
            non_preferred_words = [word_id for word_id, info in self.words.items() if preferred_category not in info['categories']]

            # 선호 단어 중 일부는 학습되지 않도록 설정
            num_to_exclude = int(len(preferred_words) * 0.15)
            excluded_words = np.random.choice(preferred_words, size=num_to_exclude, replace=False)

            # 선호하는 카테고리의 키워드에 대한 학습 횟수 설정
            for word_id in preferred_words:
                if word_id not in excluded_words:
                    self.user_word_df.at[user, word_id] = np.random.randint(5, 11)  # 높은 학습
                    # self.save_news_keyword_history(user, word_id, self.user_word_df.at[user, word_id])
                else:
                    self.user_word_df.at[user, word_id] = 0

            for word_id in non_preferred_words:
                count = np.random.randint(0, 5)  # 비선호 단어에 대해 낮은 학습 횟수
                self.user_word_df.at[user, word_id] = count
                # self.save_news_keyword_history(user, word_id, count)
        
        self.user_word_df_norm = (self.user_word_df - self.user_word_df.min()) / (self.user_word_df.max() - self.user_word_df.min())
        self.article_word_df_norm = (self.article_word_df - self.article_word_df.min()) / (self.article_word_df.max() - self.article_word_df.min())

        self.cosine_sim = cosine_similarity(self.user_word_df_norm.fillna(0), self.article_word_df_norm.fillna(0))
        self.cosine_sim_df = pd.DataFrame(self.cosine_sim, columns=self.articles, index=self.users)

    def save_news_keyword_history(self, user_id, keyword_id, read_count):
        try:
            history = NewsKeywordHistory(member_id=user_id, keyword_id=keyword_id, read_count=read_count)
            self.session.add(history)
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            print("중복된 값이 존재하여 추가하지 않습니다.")
        except Exception as e:
            self.session.rollback()
            raise e
        
    def get_most_recommended_articles(self, num_recommendations=3):
        all_recommendations = self.cosine_sim_df.apply(lambda row: row.sort_values(ascending=False).index.values.tolist()[:num_recommendations], axis=1).explode()
        most_common_recommendations = Counter(all_recommendations).most_common(num_recommendations)
        recommendations = [rec[0] for rec in most_common_recommendations]
        return recommendations

data_storage = DataStorage()

def get_news_data(news_id):
    # 뉴스 ID를 기반으로 뉴스 객체를 조회합니다.
    news = data_storage.session.query(News).filter(News.id == news_id).first()
    if news:
        # 뉴스 이미지 URL을 리스트로 추출합니다.
        images_urls = [image.image_url for image in news.news_images]
        # 뉴스 데이터와 함께 이미지 URL을 딕셔너리 형태로 반환합니다.
        return {
            "id": news.id,
            "title": news.title,
            "category": news.category,
            "write_date": news.write_date.isoformat(),
            "content": news.content,
            "summary": news.summary,
            "images_urls": images_urls
        }
    else:
        return None

@router.get("/recommend/news/{member_id}")
async def news_recommend(member_id: int):
    if member_id not in data_storage.users:
        recommendations_id = data_storage.get_most_recommended_articles()
    else:
        user_data = data_storage.cosine_sim_df.loc[member_id].sort_values(ascending=False)
        recommendations_id = user_data.index.values.tolist()[:3]
    
    recommendations = [get_news_data(int(news_id.split('기사')[-1])) for news_id in recommendations_id]

    return {
        "memberId": member_id, 
        "recommendations": recommendations
    }

# @router.get("/recommend/news/{member_id}")
# async def news_recommend(member_id: int):
#     if member_id not in data_storage.users:
#         raise HTTPException(status_code=404, detail="User not found")
#     user_data = data_storage.cosine_sim_df.loc[member_id].sort_values(ascending=False)
#     recommendations = user_data.index.values.tolist()[:3]

#     return {
#         "memberId": member_id, 
#         "recommendations": recommendations
#         }

# class MatrixFactorization(nn.Module):
#     def __init__(self, num_users, num_items, latent_dim=67.67, dropout_rate=0.5, l2=0.001):
#         super(MatrixFactorization, self).__init__()
#         self.user_embedding = nn.Embedding(num_users, latent_dim)
#         self.item_embedding = nn.Embedding(num_items, latent_dim)
#         self.user_bias = nn.Embedding(num_users, 1)
#         self.item_bias = nn.Embedding(num_items, 1)
#         self.dropout = nn.Dropout(dropout_rate)
#         self.l2 = l2

#         nn.init.normal_(self.user_embedding.weight, mean=0.0, std=0.01)
#         nn.init.normal_(self.item_embedding.weight, mean=0.0, std=0.01)
#         nn.init.zeros_(self.user_bias.weight)
#         nn.init.zeros_(self.item_bias.weight)

#     def forward(self, user_indices, item_indices):
#         user_latent = self.dropout(self.user_embedding(user_indices))
#         item_latent = self.dropout(self.item_embedding(item_indices))
#         user_bias = self.user_bias(user_indices).squeeze()
#         item_bias = self.item_bias(item_indices).squeeze()

#         prediction = torch.sum(user_latent * item_latent, dim=1) + user_bias + item_bias
#         return prediction

#     def loss(self, prediction, target):
#         mse_loss = F.mse_loss(prediction, target.float())
#         l2_loss = sum(torch.norm(param) for param in self.parameters())
#         total_loss = mse_loss + self.l2 * l2_loss
#         return total_loss

# class UserWordDataset(Dataset):
#     def __init__(self, user_word_matrix):
#         self.user_word_matrix = user_word_matrix.values
#         self.num_users, self.num_items = user_word_matrix.shape

#     def __len__(self):
#         return self.num_users * self.num_items

#     def __getitem__(self, idx):
#         user_id = idx // self.num_items
#         item_id = idx % self.num_items
#         rating = self.user_word_matrix[user_id, item_id]
#         return user_id, item_id, torch.tensor(rating, dtype=torch.float)

# # 모델과 데이터셋을 로드하는 함수
# def load_model_and_dataset(user_word_df):
#     device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
#     model_info = torch.load('best_model.pth', map_location=device)
#     state_dict = model_info['state_dict']
#     hyperparams = model_info['hyperparams']

#     # 모델 재구성
#     model = MatrixFactorization(
#         model_info['num_users'],
#         model_info['num_items'],
#         hyperparams['latent_dim'],
#         hyperparams['dropout_rate'],
#         hyperparams['l2']
#     ).to(device)

#     # 모델 상태 복원
#     model.load_state_dict(state_dict)
#     model.to(device)
#     model.eval()

#     dataset = UserWordDataset(user_word_df)
    
#     return model, dataset, device

# def fine_tune_model(model, dataset, device, lr=0.01, epochs=5, batch_size=32):
#     model.train()
#     optimizer = optim.Adam(model.parameters(), lr=lr)
#     data_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
#     for epoch in range(epochs):
#         total_loss = 0
#         for user_indices, item_indices, ratings in data_loader:
#             user_indices = user_indices.to(device)
#             item_indices = item_indices.to(device)
#             ratings = ratings.to(device)

#             optimizer.zero_grad()
#             predictions = model(user_indices, item_indices)
#             loss = model.loss(predictions, ratings)
#             loss.backward()
#             optimizer.step()

#             total_loss += loss.item()

#         print(f'Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(data_loader)}')
#     model.eval()

# def load_model_and_dataset_with_finetuning(user_word_df, fine_tune=False):
#     model, dataset, device = load_model_and_dataset(user_word_df)
    
#     if fine_tune:
#         print("Fine-tuning the model with updated data...")
#         fine_tune_model(model, dataset, device)
    
#     return model, dataset, device

# model, dataset, device = load_model_and_dataset_with_finetuning(data_storage.user_word_df, fine_tune=True)
# model, dataset, device = load_model_and_dataset(data_storage.user_word_df)

# class UserRecommendationRequest(BaseModel):
#     user_index: int

# @router.get("/recommend/word/{member_id}")
# async def word_recommend(member_id: int):
#     if member_id not in data_storage.users:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     user_index = data_storage.users.index(member_id)
    
#     untrained_item_indices = []
#     untrained_item_names = data_storage.user_word_df.iloc[user_index][data_storage.user_word_df.iloc[user_index] == 0].index.tolist()
#     for item_name in untrained_item_names:
#         item_index = data_storage.user_word_df.columns.get_loc(item_name)
#         untrained_item_indices.append(item_index)
    
#     if not untrained_item_indices:
#         return {"message": "No items to recommend for this user."}
    
#     untrained_item_indices_tensor = torch.tensor(untrained_item_indices, dtype=torch.long, device=device)
#     predictions = model(torch.tensor([user_index] * len(untrained_item_indices), device=device), untrained_item_indices_tensor)
    
#     top_scores, top_indices = torch.topk(predictions, 20)

#     recommended_item_indices = [untrained_item_indices[index.item()] for index in top_indices]
#     recommended_item_names = [data_storage.user_word_df.columns[index] for index in recommended_item_indices]
    
#     return {
#         "memberId": member_id, 
#         "recommended_items": recommended_item_names
#     }
