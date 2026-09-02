
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 配置与初始化 ---
const app = express();
const port = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 升级为 JSON Lines 格式，模拟 NoSQL 数据库存储结构化数据
const DB_FILE = path.join(__dirname, 'driver_data.jsonl');
const LEGACY_LOG_FILE = path.join(__dirname, 'system_logs.txt');

// 初始化数据文件
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '');
    console.log("数据库文件已初始化:", DB_FILE);
}

// --- 高级业务逻辑类 ---

// 1. 驾驶员状态机 (State Machine)
class DriverState {
    constructor(id) {
        this.id = id;
        this.lastFatigue = 0;       // 上一时刻疲劳值 (用于平滑)
        this.highFatigueTicks = 0;  // 连续高疲劳时长 (用于时间惩罚)
        this.startTime = Date.now();
    }

    // 核心算法：结合物理输入、平滑滤波和时间维度的疲劳计算
    calculate(input, condition) {
        // 1. 获取动态权重
        const weights = this.getWeights(condition);
        const { perclos, headPose, yawnFrequency, throttle, steering } = input;

        // 2. 场景特异性修正
        let steeringModifier = 1.0;
        let headPoseModifier = 1.0;

        if (condition === 'Curvy') steeringModifier = 0.5; // 弯道：方向盘多是正常的，减少权重
        if (condition === 'Bumpy') headPoseModifier = 0.4; // 颠簸：头动是正常的，减少权重
        if (condition === 'Backlit' || condition === 'Tunnel') headPoseModifier *= 0.8;

        // 3. 原始物理因子计算
        const visualFactor = (perclos * 0.6) + (headPose * 0.3 * headPoseModifier) + (yawnFrequency * 3.5);
        const vehicleFactor = ((100 - throttle) * 0.4) + (steering * 0.6 * steeringModifier);

        // 4. 瞬时预测值
        let rawPrediction = (visualFactor * weights.visual) + (vehicleFactor * weights.vehicle);
        
        // 5. 时间维度惩罚 (Temporal Penalty)
        // 如果疲劳值持续高于 70%，累积疲劳因子会增加
        if (this.lastFatigue > 70) {
            this.highFatigueTicks++;
        } else {
            this.highFatigueTicks = Math.max(0, this.highFatigueTicks - 1); // 休息会缓慢恢复
        }

        // 每连续5个周期高疲劳，额外增加 2% 的基础疲劳，模拟“越累越难恢复”
        const fatigueAccumulation = Math.min(20, this.highFatigueTicks * 0.5);
        rawPrediction += fatigueAccumulation;

        // 6. 指数移动平均 (EMA) 平滑滤波
        // alpha 越小，历史权重越大，曲线越平滑 (模拟人的真实反应迟滞)
        const alpha = 0.3; 
        let smoothedPrediction = (rawPrediction * alpha) + (this.lastFatigue * (1 - alpha));
        
        // 边界限制
        smoothedPrediction = Math.max(0, Math.min(100, smoothedPrediction));

        // 更新状态
        this.lastFatigue = smoothedPrediction;

        return {
            value: smoothedPrediction,
            raw: rawPrediction,
            accumulation: fatigueAccumulation,
            weights: weights
        };
    }

    getWeights(condition) {
        switch (condition) {
            case 'Backlit': return { visual: 0.3, vehicle: 0.7 };
            case 'Curvy': return { visual: 0.6, vehicle: 0.4 };
            case 'Bumpy': return { visual: 0.7, vehicle: 0.3 };
            case 'Tunnel': return { visual: 0.5, vehicle: 0.5 };
            case 'Flat': default: return { visual: 0.8, vehicle: 0.2 };
        }
    }
}

// 2. 内存数据库管理器
const driverStore = new Map();

function getDriverState(userId) {
    if (!driverStore.has(userId)) {
        console.log(`初始化新驾驶员状态: ${userId}`);
        driverStore.set(userId, new DriverState(userId));
    }
    return driverStore.get(userId);
}

// --- API 路由 ---

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: 'Segoe UI', sans-serif; padding: 3rem; max-width: 800px; margin: 0 auto; background: #f0f9ff; border-radius: 1rem;">
            <h1 style="color: #0369a1;">AI 疲劳分析引擎 v2.0</h1>
            <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <p><strong>状态:</strong> 🟢 运行中</p>
                <p><strong>模式:</strong> Stateful (状态感知)</p>
                <p><strong>活跃驾驶员:</strong> ${driverStore.size}</p>
                <p><strong>数据库:</strong> JSON Lines (${DB_FILE})</p>
            </div>
        </div>
    `);
});

app.post('/api/predict', (req, res) => {
    try {
        const { input, condition, userId = 'default_driver' } = req.body;
        
        // 获取该用户的持久化状态
        const driver = getDriverState(userId);
        
        // 执行复杂计算
        const result = driver.calculate(input, condition);

        // === 结构化日志记录 (JSONL) ===
        // 这种格式适合大数据分析，每行一个完整的 JSON 对象
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: userId,
            scenario: condition,
            inputs: input,
            metrics: {
                fatigue: parseFloat(result.value.toFixed(2)),
                raw_fatigue: parseFloat(result.raw.toFixed(2)),
                accumulation: parseFloat(result.accumulation.toFixed(2))
            },
            weights: result.weights
        };

        // 异步写入数据库文件，不阻塞主线程
        fs.appendFile(DB_FILE, JSON.stringify(logEntry) + '\n', (err) => {
            if (err) console.error("数据库写入失败:", err);
        });

        // 同时保留旧的 txt 日志方便直观查看 (可选)
        try {
            const legacyMsg = `[${new Date().toLocaleTimeString()}] 用户:${userId} | 场景:${condition} | 疲劳值:${result.value.toFixed(1)}% (累积惩罚:+${result.accumulation.toFixed(1)}%)\n`;
            fs.appendFileSync(LEGACY_LOG_FILE, legacyMsg);
        } catch(e) {}

        // 控制台输出精简信息
        console.log(`[AI分析] ${userId.padEnd(10)} | 场景:${condition.padEnd(7)} | 结果:${result.value.toFixed(1)}%`);

        res.json({ 
            success: true, 
            prediction: result.value,
            details: {
                accumulation: result.accumulation,
                weights: result.weights
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Server Error]', error);
        res.status(500).json({ success: false, message: 'Internal AI Engine Error' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log('\n=================================================');
    console.log(`   🚀 AI 疲劳分析引擎已启动 (Port ${port})`);
    console.log(`   💾 结构化存储: ${DB_FILE}`);
    console.log(`   🧠 算法模式: EMA 平滑 + 时间累积惩罚`);
    console.log('=================================================\n');
});