from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import numpy as np
import cv2
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

# 配置跨域，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MediaPipe 初始化
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True, # 开启虹膜检测，提高眼部精度
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

class ImagePayload(BaseModel):
    image: str  # Base64 格式的图片
    simulation_input: dict # 接收前端的其他模拟数据（如方向盘）

def calculate_ear(landmarks, indices):
    """计算眼睛纵横比 (EAR) - Eye Aspect Ratio"""
    # indices 是眼部关键点索引
    # 垂直距离 (两个)
    A = np.linalg.norm(landmarks[indices[1]] - landmarks[indices[5]])
    B = np.linalg.norm(landmarks[indices[2]] - landmarks[indices[4]])
    # 水平距离
    C = np.linalg.norm(landmarks[indices[0]] - landmarks[indices[3]])
    
    ear = (A + B) / (2.0 * C)
    return ear

def calculate_mar(landmarks, indices):
    """计算嘴巴纵横比 (MAR) - Mouth Aspect Ratio"""
    # 垂直距离
    A = np.linalg.norm(landmarks[indices[1]] - landmarks[indices[7]]) # 上唇内到下唇内
    B = np.linalg.norm(landmarks[indices[2]] - landmarks[indices[6]]) # 辅助垂直点
    C = np.linalg.norm(landmarks[indices[3]] - landmarks[indices[5]]) # 辅助垂直点
    # 水平距离
    D = np.linalg.norm(landmarks[indices[0]] - landmarks[indices[4]]) # 嘴角
    
    mar = (A + B + C) / (3.0 * D)
    return mar

@app.get("/")
def read_root():
    return {"status": "Python AI Engine Running", "framework": "MediaPipe + FastAPI"}

@app.post("/api/analyze_face")
async def analyze_face(payload: ImagePayload):
    try:
        # 1. Base64 解码
        if "," in payload.image:
            encoded_data = payload.image.split(',')[1]
        else:
            encoded_data = payload.image
            
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # 2. MediaPipe 处理
        results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        fatigue_score = 0
        details = {"status": "未检测到人脸", "ear": 0, "mar": 0}
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            h, w, _ = frame.shape
            # 转换为 numpy 数组 (x, y)
            points = np.array([(lm.x * w, lm.y * h) for lm in landmarks])
            
            # === 关键点索引 (MediaPipe 标准) ===
            # 左眼: [33, 160, 158, 133, 153, 144]
            # 右眼: [362, 385, 387, 263, 373, 380]
            left_eye_indices = [33, 160, 158, 133, 153, 144]
            right_eye_indices = [362, 385, 387, 263, 373, 380]
            # 嘴巴 (内圈): [78, 81, 13, 311, 308, 402, 14, 178] (简化选取)
            mouth_indices = [61, 37, 267, 314, 291, 84, 17, 146] # 外轮廓更稳定
            
            # 3. 计算特征值
            left_ear = calculate_ear(points, left_eye_indices)
            right_ear = calculate_ear(points, right_eye_indices)
            avg_ear = (left_ear + right_ear) / 2.0
            
            mar = calculate_mar(points, mouth_indices)
            
            # 4. 疲劳判定逻辑 (Scientific Logic)
            # EAR 阈值: 通常 < 0.25 表示闭眼
            # MAR 阈值: 通常 > 0.5 表示打哈欠
            
            perclos_score = 0
            yawn_score = 0
            
            # 闭眼评分 (反比)
            if avg_ear < 0.25: 
                perclos_score = min(100, (0.25 - avg_ear) * 400 + 50) # 瞬间加分
            
            # 哈欠评分
            if mar > 0.5:
                yawn_score = min(100, (mar - 0.5) * 200)
                
            # 综合评分
            fatigue_score = (perclos_score * 0.7) + (yawn_score * 0.3)
            
            details = {
                "status": "检测中",
                "ear": float(avg_ear),
                "mar": float(mar),
                "perclos_score": float(perclos_score),
                "yawn_score": float(yawn_score)
            }

        # 5. 融合前端传来的其他传感器数据 (方向盘、车速等)
        sim_input = payload.simulation_input
        vehicle_fatigue = 0
        if sim_input:
             # 方向盘急打或油门长时间未动
             vehicle_fatigue = (sim_input.get('steering', 0) * 0.5) + ((100 - sim_input.get('throttle', 80)) * 0.2)
        
        final_score = (fatigue_score * 0.8) + (vehicle_fatigue * 0.2)
        
        return {
            "prediction": min(100, final_score),
            "details": details
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # 启动服务，端口 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)