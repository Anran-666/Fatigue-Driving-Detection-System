# 疲劳驾驶检测系统 (Fatigue Driving Detection System)

## 📖 项目简介

这是一个基于 **Web 前端 (React)** 与 **Python 视觉后端 (FastAPI + MediaPipe)** 的多模态疲劳驾驶检测系统。该系统通过实时捕捉驾驶员的面部特征（眨眼、打哈欠、头部姿态），结合模拟的车辆行驶数据（方向盘转角、车速等），利用动态权重融合算法，实时评估驾驶员的疲劳等级，并提供相应的预警和干预措施。

## ✨ 核心功能

1.  **多模态数据融合**：
    *   **视觉层**：基于 MediaPipe 的 468 点人脸关键点检测，计算 EAR (眼睛纵横比)、MAR (嘴巴纵横比) 和头部欧拉角 (Pitch, Yaw, Roll)。
    *   **车辆层**：模拟车辆 CAN 总线数据（方向盘熵值、油门开度）。
    *   **环境层**：根据路况（平直、弯道、颠簸、逆光、隧道）动态调整各传感器数据的权重。

2.  **实时疲劳监测**：
    *   **PERCLOS 计算**：基于时间窗口的闭眼百分比分析。
    *   **疲劳评分模型**：包含疲劳累积效应和恢复机制的评分算法。
    *   **趋势预测**：基于历史数据预测未来的疲劳趋势。

3.  **交互式仪表盘**：
    *   实时显示疲劳指数波形图。
    *   可视化各项传感器状态与权重分布。
    *   系统干预模拟（座椅震动、香氛释放、车道保持）。

4.  **多种运行模式**：
    *   **自动模拟**：系统自动生成数据演示疲劳过程。
    *   **手动控制**：通过滑块手动调整参数测试算法响应。
    *   **实况模式 (Live)**：调用本地摄像头，通过 Python 后端进行实时分析。

## 🛠 技术栈

### 前端 (Dashboard)
*   **框架**: React 18, Vite
*   **语言**: TypeScript
*   **样式**: Tailwind CSS
*   **图表**: Recharts
*   **轻量级视觉 (Fallback)**: Jeeliz FaceFilter (仅在未连接 Python 后端时作为 UI 辅助)

### 后端 (AI Engine)
*   **框架**: FastAPI (高性能异步 Web 框架)
*   **计算机视觉**: MediaPipe (Google 开源的面部网格解决方案), OpenCV
*   **数据处理**: NumPy

## 📐 算法原理

### 1. 眼睛纵横比 (EAR - Eye Aspect Ratio)
用于检测眨眼和闭眼。
$$ EAR = \frac{||p_2 - p_6|| + ||p_3 - p_5||}{2 \times ||p_1 - p_4||} $$
当 EAR 低于阈值（默认为 0.2）时，判定为闭眼。

### 2. 嘴巴纵横比 (MAR - Mouth Aspect Ratio)
用于检测打哈欠。通过计算嘴唇内轮廓的高度与宽度的比值。当 MAR 高于阈值（默认为 0.5）且持续一定时间，判定为打哈欠。

### 3. 头部姿态 (Head Pose)
利用 3D 面部关键点求解 PnP (Perspective-n-Point) 问题，计算头部的 Pitch (点头), Yaw (转头), Roll (歪头) 角度。大幅度的点头通常与瞌睡相关。

### 4. 疲劳评分逻辑
系统维护一个 `score` (0-100)，初始为 0 (清醒)。
*   **加分项**：高频眨眼、长时间闭眼、打哈欠、频繁点头。
*   **减分项**：保持清醒状态一段时间后，分数会缓慢自然衰减（模拟休息恢复）。
*   **权重调节**：在颠簸路段降低头部姿态权重；在逆光路段降低视觉权重，提高车辆数据权重。

## 🚀 安装与运行指南

### 前置要求
*   Node.js (v16+)
*   Python (v3.8+)
*   摄像头设备

### 第一步：启动 Python 视觉后端

1.  进入后端目录：
    ```bash
    cd server
    ```

2.  安装依赖：
    ```bash
    # 推荐使用虚拟环境
    pip install -r requirements.txt
    
    # 如果遇到网络问题，请使用国内镜像源
    pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
    ```

3.  运行服务器：
    ```bash
    python main.py
    ```
    *后端服务将在 `http://localhost:8000` 启动。*

### 第二步：启动 React 前端

1.  回到项目根目录：
    ```bash
    cd ..
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

3.  启动开发服务器：
    ```bash
    npm run dev
    ```
    *前端页面将在 `http://localhost:5173` (或其他端口) 启动。*

## 🖥 使用说明

1.  打开浏览器访问前端地址。
2.  在仪表盘中间的控制面板中，点击 **"实况 (Live)"** 按钮。
3.  允许浏览器访问摄像头权限。
4.  此时前端会将视频帧发送给 Python 后端，后端分析后返回疲劳状态，仪表盘将实时更新数据。
5.  你可以尝试闭眼、打哈欠或点头，观察疲劳指数的变化。

## 📂 项目结构

```
.
├── components/          # React UI 组件
│   ├── Dashboard.tsx    # 主仪表盘
│   ├── FatigueChart.tsx # 疲劳趋势图
│   └── ...
├── server/              # Python 后端代码
│   ├── main.py          # FastAPI 应用入口与核心算法
│   └── requirements.txt # Python 依赖
├── App.tsx              # 主应用逻辑
├── types.ts             # TypeScript 类型定义
├── vite.config.ts       # Vite 配置 (包含 API 代理设置)
└── README.md            # 项目说明
```

## ⚠️ 注意事项

*   **光线环境**：请确保摄像头环境光线充足，以便 MediaPipe 准确识别面部特征。
*   **代理配置**：前端通过 `vite.config.ts` 中的 proxy 将 `/api` 请求转发至 `localhost:8000`，请确保后端端口未被修改。
*   **隐私说明**：所有图像处理均在本地进行，不会上传至任何云端服务器。
