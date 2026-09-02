
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import SystemInfoModal from './components/SystemInfoModal';
import FaceTrackingController from './components/FaceTrackingController';
import { SettingsIcon, InfoIcon } from './components/icons';
import { DriverStatus, FatigueLevel, Intervention, Settings, LogEntry, SensorData, SimulationInput, RoadCondition, WeightDistribution, UserId, UserSettings, SystemHealth, SimulationMode, ScenarioId, CameraStatus } from './types';

const defaultSettings: Settings = {
    lightThreshold: 60,
    mediumThreshold: 75,
    heavyThreshold: 90,
    lightVibration: 2,
    aromaEnabled: true,
    laneAssistEnabled: true,
};

const initialUserSettings: UserSettings = {
    'driver1': defaultSettings,
    'driver2': {
        ...defaultSettings,
        lightThreshold: 65,
        mediumThreshold: 80,
        aromaEnabled: false,
    },
};

const initialSimulationInput: SimulationInput = {
    perclos: 10,
    headPose: 5,
    yawnFrequency: 0,
    throttle: 85,
    steering: 10,
};

const getInitialDriverStatus = (): DriverStatus => ({
  fatigueIndex: 15,
  fatigueLevel: FatigueLevel.Awake,
  prediction: [],
  history: Array(30).fill(15),
});


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserId>('driver1');
  const [userSettings, setUserSettings] = useState<UserSettings>(initialUserSettings);
  
  const [driverStatus, setDriverStatus] = useState<DriverStatus>(getInitialDriverStatus());

  const [sensorData, setSensorData] = useState<SensorData>({
    camera: '校准中',
    canBus: '已断开',
    seatPressure: '正常',
  });
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    mcu: { status: 'loading', message: '正在初始化...' },
    gps: { status: 'loading', message: '正在搜星...' },
    gyroscope: { status: 'ok', message: '校准完成' },
    storage: { status: 'ok', message: '85% 可用' },
    server: { status: 'loading', message: '正在连接 Python 引擎...' },
  });

  const [roadCondition, setRoadCondition] = useState<RoadCondition>('Flat');
  const [currentWeights, setCurrentWeights] = useState<WeightDistribution>({ visual: 0.8, vehicle: 0.2, justification: '标准路况，主要依赖视觉数据进行判断。' });


  const [intervention, setIntervention] = useState<Intervention>({
    level: FatigueLevel.Awake,
    message: '系统已激活，请选择模拟模式。',
  });

  const [log, setLog] = useState<LogEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('auto');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInput, setSimulationInput] = useState<SimulationInput>(initialSimulationInput);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('highway');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const simulationIntervalRef = useRef<number | null>(null);
  const simulationTimeRef = useRef<number>(0);
  const isSimulatingRef = useRef(isSimulating);


  const currentSettings = userSettings[currentUser];
  
  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  useEffect(() => {
    const connectSystem = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSensorData(prev => ({ ...prev, camera: '工作中' }));
      await new Promise(resolve => setTimeout(resolve, 500));
      setSensorData(prev => ({ ...prev, canBus: '已连接' }));

      await new Promise(resolve => setTimeout(resolve, 1000));
      setSystemHealth(prev => ({ ...prev, mcu: { status: 'ok', message: '运行正常' }}));
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSystemHealth(prev => ({ ...prev, gps: { status: 'ok', message: '信号良好' }}));
      await new Promise(resolve => setTimeout(resolve, 500));
      setSystemHealth(prev => ({ ...prev, storage: { status: 'ok', message: '84% 可用' }}));
    };

    connectSystem();
  }, []); 


  const getFatigueLevel = useCallback((index: number, settings: Settings): FatigueLevel => {
    if (index >= settings.heavyThreshold) return FatigueLevel.Severe;
    if (index >= settings.mediumThreshold) return FatigueLevel.Medium;
    if (index >= settings.lightThreshold) return FatigueLevel.Light;
    return FatigueLevel.Awake;
  }, []);
  
  const getWeights = useCallback((condition: RoadCondition): WeightDistribution => {
    switch (condition) {
        case 'Backlit':
            return { visual: 0.3, vehicle: 0.7, justification: '逆光导致视觉数据可信度降低，提升车辆数据权重。' };
        case 'Curvy':
            return { visual: 0.6, vehicle: 0.4, justification: '弯道场景，方向盘操作更频繁，适当调整权重以减少误判。' };
        case 'Bumpy':
            return { visual: 0.7, vehicle: 0.3, justification: '颠簸路段，头部姿态和座椅压力数据可能异常，调整权重。' };
        case 'Tunnel':
            return { visual: 0.5, vehicle: 0.5, justification: '隧道内光线变化，平衡视觉与车辆数据权重。' };
        case 'Flat':
        default:
            return { visual: 0.8, vehicle: 0.2, justification: '标准路况，主要依赖视觉数据进行判断。' };
    }
  }, []);

  useEffect(() => {
    setCurrentWeights(getWeights(roadCondition));
  }, [roadCondition, getWeights]);
  
  const addLogEntry = (message: string, level: FatigueLevel) => {
    const newEntry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level,
    };
    setLog(prevLog => [newEntry, ...prevLog.slice(0, 9)]);
  };
  
  const updateDriverStatus = useCallback((newIndex: number) => {
      setDriverStatus(prevStatus => {
          const newLevel = getFatigueLevel(newIndex, currentSettings);
          const newHistory = [...prevStatus.history.slice(1), newIndex];
          const newPrediction = Array.from({ length: 12 }, (_, i) => {
              const predictedIndex = newIndex + (Math.random() - 0.4) * (i + 1) * 1.5;
              return Math.max(0, Math.min(100, predictedIndex));
          });

          return {
              fatigueIndex: newIndex,
              fatigueLevel: newLevel,
              prediction: newPrediction,
              history: newHistory,
          };
      });
  }, [getFatigueLevel, currentSettings]);

  // 处理实况模式下发送图片到 Python 后端
  const handleImageCapture = useCallback(async (imageData: string) => {
      if (simulationMode !== 'live') return;

      try {
          // 注意：Python FastAPI 默认端口通常是 8000
          const response = await fetch('http://localhost:8000/api/analyze_face', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                  image: imageData,
                  simulation_input: simulationInput // 发送其他模拟数据作为辅助
              }),
          });

          if (response.ok) {
              const data = await response.json();
              setSystemHealth(prev => ({ ...prev, server: { status: 'ok', message: 'Python 视觉引擎在线' } }));
              
              // 使用 Python 计算的更精确结果
              if (data.prediction !== undefined) {
                  updateDriverStatus(data.prediction);
                  // 如果后端返回了详细特征数据，也可以更新到 simulationInput 做可视化（可选）
                  // setSimulationInput(prev => ({...prev, perclos: data.details.ear * ...}))
              }
          } else {
              throw new Error('API Error');
          }
      } catch (error) {
           // 静默失败，避免控制台刷屏，但更新状态
           setSystemHealth(prev => ({ ...prev, server: { status: 'error', message: 'Python 后端未连接' } }));
      }
  }, [simulationMode, simulationInput, updateDriverStatus]);

  // 传统的模拟数据请求 (用于非实况模式)
  const fetchFatiguePrediction = useCallback(async (input: SimulationInput, condition: RoadCondition): Promise<number> => {
    // 在非 Live 模式下，我们仍然可以使用简单的本地逻辑，或者也发给 Python (如果不带图片)
    // 为了简化，非 Live 模式使用本地逻辑，Live 模式使用 Python 视觉逻辑
    const weights = getWeights(condition);
    const { perclos, headPose, yawnFrequency, throttle, steering } = input;

    let steeringModifier = 1.0;
    let headPoseModifier = 1.0;

    if (condition === 'Curvy') steeringModifier = 0.5;
    if (condition === 'Bumpy') headPoseModifier = 0.4;
    if (condition === 'Backlit' || condition === 'Tunnel') headPoseModifier *= 0.8;

    const visualFactor = (perclos * 0.6) + (headPose * 0.3 * headPoseModifier) + (yawnFrequency * 3.5);
    const vehicleFactor = ((100 - throttle) * 0.4) + (steering * 0.6 * steeringModifier);

    let predictedIndex = (visualFactor * weights.visual) + (vehicleFactor * weights.vehicle);
    return Math.max(0, Math.min(100, predictedIndex));
  }, [getWeights]);
  
  
  // Effect for updating status (非 Live 模式)
  useEffect(() => {
    if (isSimulating || simulationMode === 'live') return;

    const handleUpdate = async () => {
        const newIndex = await fetchFatiguePrediction(simulationInput, roadCondition);
        updateDriverStatus(newIndex);
    };

    handleUpdate();
  }, [simulationInput, roadCondition, isSimulating, simulationMode, fetchFatiguePrediction, updateDriverStatus]);


  const handleSimulationInputChange = useCallback((name: keyof SimulationInput, value: number) => {
      setSimulationInput(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleFaceDataUpdate = useCallback((faceData: Partial<SimulationInput>) => {
      // 仅在 Live 模式下更新 UI 上的滑块，实际计算走 Python
      setSimulationInput(prev => ({
          ...prev,
          ...faceData,
      }));
  }, []);

  const runSimulationTick = useCallback(async () => {
      if (!isSimulatingRef.current) return;
      simulationTimeRef.current += 1;
      const time = simulationTimeRef.current;
      
      let automatedInput: SimulationInput;
      const maxTime = 60; 
      const progress = Math.min(time / maxTime, 1.0);
      
      switch (selectedScenario) {
          case 'highway': 
              automatedInput = {
                perclos: initialSimulationInput.perclos + (75 - initialSimulationInput.perclos) * progress,
                headPose: initialSimulationInput.headPose + (60 - initialSimulationInput.headPose) * progress,
                yawnFrequency: Math.min(10, Math.floor(progress * 8) + (Math.random() > 0.96 ? 1 : 0)),
                throttle: initialSimulationInput.throttle - 20 * progress,
                steering: initialSimulationInput.steering + (70 - initialSimulationInput.steering) * progress,
              };
              break;
          case 'urban': 
              automatedInput = {
                  perclos: 10 + Math.sin(time / 2) * 5,
                  headPose: 5 + Math.cos(time / 3) * 4,
                  yawnFrequency: Math.random() > 0.98 ? 1 : 0,
                  throttle: 50 + Math.sin(time) * 45,
                  steering: 30 + Math.cos(time * 1.5) * 25,
              };
              break;
          case 'normal': 
          default:
              automatedInput = {
                  perclos: 12 + (Math.random() - 0.5) * 4,
                  headPose: 6 + (Math.random() - 0.5) * 4,
                  yawnFrequency: 0,
                  throttle: 80 + (Math.random() - 0.5) * 10,
                  steering: 15 + (Math.random() - 0.5) * 8,
              };
              break;
      }

      setSimulationInput(automatedInput);

      // Add noise for realism
      const noisyInput: SimulationInput = {
          perclos: Math.max(0, Math.min(100, automatedInput.perclos + (Math.random() - 0.5) * 8)),
          headPose: Math.max(0, Math.min(100, automatedInput.headPose + (Math.random() - 0.5) * 10)),
          yawnFrequency: Math.max(0, Math.min(10, automatedInput.yawnFrequency)),
          throttle: Math.max(0, Math.min(100, automatedInput.throttle + (Math.random() - 0.5) * 5)),
          steering: Math.max(0, Math.min(100, automatedInput.steering + (Math.random() - 0.5) * 10)),
      };

      const newIndex = await fetchFatiguePrediction(noisyInput, roadCondition);

      if (!isSimulatingRef.current) return;

      updateDriverStatus(newIndex);
      
  }, [roadCondition, fetchFatiguePrediction, selectedScenario, updateDriverStatus, initialSimulationInput]);

  const resetSystemState = useCallback(() => {
    setSimulationInput(initialSimulationInput);
    setDriverStatus(getInitialDriverStatus());
    setLog([]);
    setIntervention({ level: FatigueLevel.Awake, message: '系统已激活，请选择模拟模式。' });
  }, []);

  const toggleSimulation = useCallback(() => {
      if (simulationMode !== 'auto') return;

      setIsSimulating(prev => {
          const isStarting = !prev;
          if (isStarting) {
              simulationTimeRef.current = 0;
              runSimulationTick();
              simulationIntervalRef.current = window.setInterval(runSimulationTick, 2000);
          } else {
              if (simulationIntervalRef.current) {
                  window.clearInterval(simulationIntervalRef.current);
              }
              resetSystemState();
          }
          return isStarting;
      });
  }, [runSimulationTick, simulationMode, resetSystemState]);
  
  const handleModeChange = useCallback((mode: SimulationMode) => {
    if (isSimulating) {
        toggleSimulation(); 
    }
    
    if (mode === 'live') {
        setCameraStatus('initializing');
    } else {
        setCameraStatus('idle');
    }

    setSimulationMode(mode);
    resetSystemState();
  }, [isSimulating, toggleSimulation, resetSystemState]);
  
  const handleScenarioChange = useCallback((scenarioId: ScenarioId) => {
      if (isSimulating) return;
      setSelectedScenario(scenarioId);
      resetSystemState();
  }, [isSimulating, resetSystemState]);

  useEffect(() => {
      return () => {
          if (simulationIntervalRef.current) {
              window.clearInterval(simulationIntervalRef.current);
          }
      };
  }, []);

  useEffect(() => {
    let newIntervention: Intervention;
    const isRunning = isSimulating || simulationMode === 'manual' || simulationMode === 'live';

    const currentLevel = getFatigueLevel(driverStatus.fatigueIndex, currentSettings);

    switch (currentLevel) {
      case FatigueLevel.Light:
        newIntervention = { level: FatigueLevel.Light, message: '检测到轻度疲劳，座椅振动已激活。' };
        break;
      case FatigueLevel.Medium:
        newIntervention = { level: FatigueLevel.Medium, message: '检测到中度疲劳，正在释放提神香氛。' };
        break;
      case FatigueLevel.Severe:
        newIntervention = { level: FatigueLevel.Severe, message: '重度疲劳！车道保持辅助已介入。请寻找安全地点休息。' };
        break;
      default:
        if (isRunning && driverStatus.history.some(h => h > 15)) {
            newIntervention = { level: FatigueLevel.Awake, message: '系统监控中，请安全驾驶。' };
        } else {
            newIntervention = { level: FatigueLevel.Awake, message: '系统已激活，请选择模拟模式。' };
        }
        break;
    }

    if (newIntervention.message !== intervention.message) {
      setIntervention(newIntervention);
      if (newIntervention.level !== FatigueLevel.Awake) {
        addLogEntry(newIntervention.message, newIntervention.level);
      }
    }
  }, [driverStatus.fatigueIndex, isSimulating, simulationMode, intervention.message, driverStatus.history, currentSettings, getFatigueLevel]);
  
  const handleUserChange = useCallback((userId: UserId) => {
    if (isSimulating) {
        toggleSimulation();
    }
    setCurrentUser(userId);
    resetSystemState();
  }, [isSimulating, toggleSimulation, resetSystemState]);
  
  const handleSaveSettings = useCallback((newSettings: Settings) => {
    setUserSettings(prev => ({
        ...prev,
        [currentUser]: newSettings,
    }));
  }, [currentUser]);

  const openInfoModal = useCallback(() => setIsInfoModalOpen(true), []);
  const closeInfoModal = useCallback(() => setIsInfoModalOpen(false), []);
  const openSettingsModal = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettingsModal = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <Header 
            currentUser={currentUser}
            users={Object.keys(initialUserSettings) as UserId[]}
            onUserChange={handleUserChange}
        />
        <main>
          <Dashboard
            driverStatus={driverStatus}
            sensorData={sensorData}
            intervention={intervention}
            log={log}
            simulationMode={simulationMode}
            onModeChange={handleModeChange}
            isSimulating={isSimulating}
            onToggleSimulation={toggleSimulation}
            simulationInput={simulationInput}
            onSimulationInputChange={handleSimulationInputChange}
            settings={currentSettings}
            roadCondition={roadCondition}
            onRoadConditionChange={setRoadCondition}
            weights={currentWeights}
            systemHealth={systemHealth}
            selectedScenario={selectedScenario}
            onScenarioChange={handleScenarioChange}
            cameraStatus={cameraStatus}
          />
        </main>
      </div>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4">
        <button
          onClick={openInfoModal}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform duration-200 hover:scale-110"
          aria-label="打开系统信息"
        >
          <InfoIcon className="w-6 h-6" />
        </button>
        <button
          onClick={openSettingsModal}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform duration-200 hover:scale-110"
          aria-label="打开设置"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>
      <SystemInfoModal
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettingsModal}
        settings={currentSettings}
        onSave={handleSaveSettings}
      />
      <FaceTrackingController 
        isActive={simulationMode === 'live'}
        onUpdate={handleFaceDataUpdate}
        onStatusChange={setCameraStatus}
        onImageCapture={handleImageCapture}
      />
    </div>
  );
};

export default App;