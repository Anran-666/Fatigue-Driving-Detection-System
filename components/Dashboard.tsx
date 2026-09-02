import React from 'react';
import StatusCard from './StatusCard';
import FatigueChart from './FatigueChart';
import InterventionPanel from './InterventionPanel';
import SimulationControlPanel from './SimulationControlPanel';
import WeightAnalysisPanel from './WeightAnalysisPanel';
import SystemHealthPanel from './SystemHealthPanel';
import { DriverStatus, SensorData, Intervention, LogEntry, FatigueLevel, SimulationInput, Settings, RoadCondition, WeightDistribution, SystemHealth, SimulationMode, ScenarioId, CameraStatus } from '../types';
import { ThermometerIcon, SpeedometerIcon, CameraIcon } from './icons';

interface DashboardProps {
  driverStatus: DriverStatus;
  sensorData: SensorData;
  intervention: Intervention;
  log: LogEntry[];
  simulationMode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationInput: SimulationInput;
  onSimulationInputChange: (name: keyof SimulationInput, value: number) => void;
  settings: Settings;
  roadCondition: RoadCondition;
  onRoadConditionChange: (condition: RoadCondition) => void;
  weights: WeightDistribution;
  systemHealth: SystemHealth;
  selectedScenario: ScenarioId;
  onScenarioChange: (scenarioId: ScenarioId) => void;
  cameraStatus: CameraStatus;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  driverStatus, sensorData, intervention, log, simulationMode, onModeChange, isSimulating, onToggleSimulation, simulationInput, onSimulationInputChange, settings, roadCondition, onRoadConditionChange, weights, systemHealth, selectedScenario, onScenarioChange, cameraStatus
}) => {
  const getFatigueColor = (level: FatigueLevel) => {
    switch (level) {
      case FatigueLevel.Severe: return 'text-red-400';
      case FatigueLevel.Medium: return 'text-yellow-400';
      case FatigueLevel.Light: return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard 
            title="疲劳指数" 
            value={driverStatus.fatigueIndex.toFixed(0)} 
            unit="%"
            icon={<SpeedometerIcon className="w-8 h-8"/>}
            color={getFatigueColor(driverStatus.fatigueLevel)}
          />
          <StatusCard 
            title="驾驶员状态" 
            value={driverStatus.fatigueLevel}
            icon={<ThermometerIcon className="w-8 h-8"/>}
            color={getFatigueColor(driverStatus.fatigueLevel)}
          />
          <StatusCard 
            title="摄像头状态" 
            value={sensorData.camera}
            icon={<CameraIcon className="w-8 h-8"/>}
            color={sensorData.camera === '工作中' ? 'text-green-400' : 'text-yellow-400'}
          />
        </div>
        <FatigueChart 
          historyData={driverStatus.history} 
          predictionData={driverStatus.prediction} 
          settings={settings}
        />
        <SimulationControlPanel 
          simulationMode={simulationMode}
          onModeChange={onModeChange}
          isSimulating={isSimulating}
          onToggleSimulation={onToggleSimulation}
          simulationInput={simulationInput}
          onInputChange={onSimulationInputChange}
          roadCondition={roadCondition}
          onRoadConditionChange={onRoadConditionChange}
          selectedScenario={selectedScenario}
          onScenarioChange={onScenarioChange}
          cameraStatus={cameraStatus}
        />
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <InterventionPanel intervention={intervention} log={log} />
        <SystemHealthPanel healthData={systemHealth} />
        <WeightAnalysisPanel roadCondition={roadCondition} weights={weights} />
      </div>
    </div>
  );
};

export default Dashboard;
