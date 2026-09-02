
export enum FatigueLevel {
  Awake = '清醒',
  Light = '轻度疲劳',
  Medium = '中度疲劳',
  Severe = '重度疲劳',
}

export type RoadCondition = 'Flat' | 'Curvy' | 'Bumpy' | 'Backlit' | 'Tunnel';
export type SimulationMode = 'auto' | 'manual' | 'file' | 'live';
export type ScenarioId = 'normal' | 'highway' | 'urban';

export interface WeightDistribution {
  visual: number;
  vehicle: number;
  justification: string;
}

export interface DriverStatus {
  fatigueIndex: number;
  fatigueLevel: FatigueLevel;
  prediction: number[];
  history: number[];
}

export interface SensorData {
  camera: '工作中' | '未工作' | '校准中';
  canBus: '已连接' | '已断开';
  seatPressure: '正常' | '异常' | '空载';
}

export interface Intervention {
  level: FatigueLevel;
  message: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level: FatigueLevel;
}

export interface Settings {
  lightThreshold: number;
  mediumThreshold: number;
  heavyThreshold: number;
  lightVibration: number;
  aromaEnabled: boolean;
  laneAssistEnabled: boolean;
}

export type UserId = 'driver1' | 'driver2';

export type UserSettings = {
  [key in UserId]: Settings;
};

export interface SimulationInput {
  perclos: number; // 眼睑闭合百分比 (0-100)
  headPose: number; // 头部姿态/点头程度 (0-100)
  yawnFrequency: number; // 哈欠频率 (每分钟次数)
  throttle: number; // 油门开度 (0-100)
  steering: number; // 方向盘操作异常 (0-100)
}

export type ComponentStatus = 'ok' | 'warning' | 'error' | 'loading';

export interface SystemHealth {
    mcu: { status: ComponentStatus; message: string };
    gps: { status: ComponentStatus; message: string };
    gyroscope: { status: ComponentStatus; message: string };
    storage: { status: ComponentStatus; message: string };
    server: { status: ComponentStatus; message: string }; // Added server status
}

export type CameraStatus = 'idle' | 'initializing' | 'running' | 'error' | 'notfound';
