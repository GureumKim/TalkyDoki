from fastapi import Depends, HTTPException, APIRouter
from fastapi.responses import FileResponse
from database import SessionLocal
from sqlalchemy.orm import Session
from datetime import datetime
from models.news import News

import requests, subprocess, os

router = APIRouter()

API_URL = "http://j10c107.p.ssafy.io:8080"

# 데이터베이스 세션 생성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_news(db: Session):
    return db.query(News.id, News.title, News.content, News.summary).all()

def save_data(news_data, base_path="/input"):
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    today_str = datetime.now().strftime("%Y%m%d")
    filename = f"news_data_{today_str}.txt"
    full_path = os.path.join(base_path, filename)
    with open(full_path, "w", encoding="utf-8") as file:
        for news in news_data:
            file.write(f"ID\n{news.id}\nTITLE\n{news.title}\nSUMMARY\n{news.summary}\nCONTENT\n{news.content}\n")
    return full_path

def copy_to_hdfs(local_path, hdfs_path="/input"):
    hadoop_home = os.environ.get("HADOOP_HOME")
    if hadoop_home:
        os.environ["PATH"] += os.pathsep + os.path.join(hadoop_home, "bin")
 
    result = subprocess.run(["hdfs", "dfs", "-put", local_path, hdfs_path], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error copying file to HDFS: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, result.args, output=result.stdout, stderr=result.stderr)
    else:
        print(f"File {local_path} copied to HDFS path {hdfs_path} successfully.")

def generate_output_path(base_path="/output"):
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"{base_path}/{timestamp}"

def start_hadoop_streaming(input_file):
    output_path = generate_output_path()
    hadoop_command = f"hadoop jar /usr/local/hadoop/share/hadoop/tools/lib/hadoop-streaming-*.jar -files /home/ubuntu/data-processing/TF_mapper.py,/home/ubuntu/data-processing/TF_reducer.py -mapper 'python3 /home/ubuntu/data-processing/TF_mapper.py' -reducer 'python3 /home/ubuntu/data-processing/TF_reducer.py' -input {input_file} -output {output_path}"
    try:
        subprocess.run(hadoop_command, check=True, shell=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing Hadoop Streaming Job : {e}")
        return False

@router.get("/fetch-news")
async def fetch_news_to_file(db: Session = Depends(get_db)):
    news_data = get_news(db)
    input_file = save_data(news_data)
    copy_to_hdfs(input_file)
    hdfs_input_file = "/input/" + os.path.basename(input_file)
    if start_hadoop_streaming(hdfs_input_file):
        message = "News data fetched and copied to HDFS successfully. Hadoop Streaming job started successfully!"
        await extract_japanese()
    else:
        message = "News data fetched and copied to HDFS, but failed to start Hadoop Streaming job."
    
    return {"message": message}

@router.get("/extract-japanese")
async def extract_japanese():
    base_path = "output"
    today_str = datetime.now().strftime("%Y%m%d")
    input_path = os.path.join(base_path, today_str, "part-00000")
    
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Result file not found for today.")

    try:
        with open(input_path, "r", encoding="utf-8") as file:
            content = file.readlines()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    
    unique_words = set()
    for line in content:
        words = line.split()
        if len(words) > 2:
            japanese_word = words[1]
            unique_words.add(japanese_word)
    
    result_filename = "japanese.txt"
    with open(result_filename, "w", encoding="utf-8") as file:
        for word in sorted(unique_words):
            file.write(word + "\n")
    
    await upload_keywords()
    return FileResponse(result_filename)


@router.get("/upload-keywords")
async def upload_keywords():
    input_filename = "japanese.txt"
    if not os.path.exists(input_filename):
        raise HTTPException(status_code=404, detail="japanese.txt file not found")

    failed_keywords = []  # 실패한 키워드를 추적하기 위한 리스트
    try:
        with open(input_filename, "r", encoding="utf-8") as file:
            for line in file:
                japanese = line.strip()
                keyword_data = {"japanese": japanese}
                try:
                    response = requests.post(f'{API_URL}/api/v1/keywords/post', json=keyword_data)
                    if response.status_code != 200:
                        failed_keywords.append(japanese)
                except Exception as e:
                    failed_keywords.append(japanese)
                    print(f"Error while inserting keyword: {japanese}, Error: {str(e)}")
                
        if failed_keywords:
            return {
                "message": "Some keywords failed to be inserted.",
                "failed_keywords": failed_keywords,
                "failed_count": len(failed_keywords)
            }
        return {"message": "All keywords were successfully inserted."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
