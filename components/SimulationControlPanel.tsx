import React from 'react';
import { SimulationInput, RoadCondition, SimulationMode, ScenarioId, CameraStatus } from '../types';
import { SlidersIcon, PlayIcon, StopIcon, FileIcon, ClipboardListIcon } from './icons';

interface SimulationControlPanelProps {
    simulationMode: SimulationMode;
    onModeChange: (mode: SimulationMode) => void;
    isSimulating: boolean;
    onToggleSimulation: () => void;
    simulationInput: SimulationInput;
    onInputChange: (name: keyof SimulationInput, value: number) => void;
    roadCondition: RoadCondition;
    onRoadConditionChange: (condition: RoadCondition) => void;
    selectedScenario: ScenarioId;
    onScenarioChange: (scenarioId: ScenarioId) => void;
    cameraStatus: CameraStatus;
}

const roadConditionMap: { [key in RoadCondition]: string } = {
    Flat: '平直道路',
    Curvy: '弯道场景',
    Bumpy: '颠簸路段',
    Backlit: '逆光场景',
    Tunnel: '隧道',
};

const scenarioMap: { [key in ScenarioId]: string } = {
    normal: '常规驾驶',
    highway: '高速催眠',
    urban: '市区拥堵',
};

const cameraStatusMap: { [key in CameraStatus]: { text: string; color: string } } = {
    idle: { text: '', color: '' },
    initializing: { text: '正在启动摄像头...', color: 'text-yellow-400' },
    running: { text: '面部追踪已激活', color: 'text-green-400' },
    notfound: { text: '未检测到面部', color: 'text-yellow-400' },
    error: { text: '摄像头访问失败', color: 'text-red-400' },
};

const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({ 
    simulationMode,
    onModeChange,
    isSimulating,
    onToggleSimulation,
    simulationInput,
    onInputChange,
    roadCondition,
    onRoadConditionChange,
    selectedScenario,
    onScenarioChange,
    cameraStatus,
}) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onInputChange(name as keyof SimulationInput, Number(value));
    };
    
    const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onRoadConditionChange(e.target.value as RoadCondition);
    };
    
    const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onScenarioChange(e.target.value as ScenarioId);
    };

    const isAutoMode = simulationMode === 'auto';
    const isManualMode = simulationMode === 'manual';
    const isFileMode = simulationMode === 'file';
    const isLiveMode = simulationMode === 'live';
    const slidersDisabled = isSimulating || !isManualMode;

    const renderActionButton = () => {
        if (isAutoMode) {
            return (
                <button
                    type="button"
                    onClick={onToggleSimulation}
                    className={`w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out ${
                        isSimulating
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isSimulating ? (
                        <><StopIcon className="w-5 h-5 mr-2" />停止模拟</>
                    ) : (
                        <><PlayIcon className="w-5 h-5 mr-2" />开始自动模拟</>
                    )}
                </button>
            );
        }
        if (isFileMode) {
            return (
                 <button
                    type="button"
                    disabled // Placeholder
                    className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg bg-gray-600 text-gray-400 cursor-not-allowed"
                >
                    <FileIcon className="w-5 h-5 mr-2" />
                    载入场景 (待开发)
                </button>
            )
        }
        return null; // No button for manual or live mode as it's live
    }

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <SlidersIcon className="w-5 h-5 mr-2 text-gray-400"/>
                模拟数据输入
            </h3>

            <div className="mb-4">
                <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => onModeChange('auto')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>自动</button>
                    <button onClick={() => onModeChange('manual')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>手动</button>
                    <button onClick={() => onModeChange('live')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'live' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>实况</button>
                    <button onClick={() => onModeChange('file')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'file' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>文件</button>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="roadCondition" className="text-sm text-gray-300 mb-1 block">当前路况</label>
                    <select 
                        id="roadCondition"
                        value={roadCondition}
                        onChange={handleConditionChange}
                        disabled={isSimulating}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {Object.entries(roadConditionMap).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {isAutoMode && (
                    <div>
                        <label htmlFor="scenario" className="text-sm text-gray-300 mb-1 block flex items-center"><ClipboardListIcon className="w-4 h-4 mr-2"/>驾驶场景</label>
                         <select 
                            id="scenario"
                            value={selectedScenario}
                            onChange={handleScenarioChange}
                            disabled={isSimulating}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {Object.entries(scenarioMap).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {isLiveMode && (
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <p className={`text-sm font-semibold ${cameraStatusMap[cameraStatus].color}`}>
                            {cameraStatusMap[cameraStatus].text}
                        </p>
                         {cameraStatus === 'running' && <p className="text-xs text-gray-400 mt-1">系统正通过摄像头实时分析您的面部状态。</p>}
                    </div>
                )}


                 {isFileMode && (
                    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                        <p className="text-gray-400 text-sm">文件回放模式允许您载入预先录制的驾驶场景数据，用于复现和分析特定事件。</p>
                    </div>
                )}
                <div className={`${isFileMode ? 'hidden' : ''}`}>
                    <div>
                        <label htmlFor="perclos" className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>PERCLOS (眼部)</span>
                            <span>{simulationInput.perclos.toFixed(0)}%</span>
                        </label>
                        <input type="range" id="perclos" name="perclos" min="0" max="100" value={simulationInput.perclos} onChange={handleInputChange} disabled={slidersDisabled || isLiveMode} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"/>
                    </div>
                    <div>
                        <label htmlFor="headPose" className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>头部姿态 (点头)</span>
                            <span>{simulationInput.headPose.toFixed(0)}%</span>
                        </label>
                        <input type="range" id="headPose" name="headPose" min="0" max="100" value={simulationInput.headPose} onChange={handleInputChange} disabled={slidersDisabled || isLiveMode} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"/>
                    </div>
                    <div>
                        <label htmlFor="yawnFrequency" className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>哈欠频率 (/分钟)</span>
                            <span>{simulationInput.yawnFrequency.toFixed(0)}</span>
                        </label>
                        <input type="range" id="yawnFrequency" name="yawnFrequency" min="0" max="10" step="1" value={simulationInput.yawnFrequency} onChange={handleInputChange} disabled={slidersDisabled || isLiveMode} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"/>
                    </div>
                    <div>
                        <label htmlFor="throttle" className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>油门开度</span>
                            <span>{simulationInput.throttle.toFixed(0)}%</span>
                        </label>
                        <input type="range" id="throttle" name="throttle" min="0" max="100" value={simulationInput.throttle} onChange={handleInputChange} disabled={slidersDisabled || isLiveMode} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"/>
                    </div>
                    <div>
                        <label htmlFor="steering" className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>方向盘操作异常</span>
                            <span>{simulationInput.steering.toFixed(0)}%</span>
                        </label>
                        <input type="range" id="steering" name="steering" min="0" max="100" value={simulationInput.steering} onChange={handleInputChange} disabled={slidersDisabled || isLiveMode} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"/>
                    </div>
                </div>
                <div className="pt-2">
                    {renderActionButton()}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SimulationControlPanel);