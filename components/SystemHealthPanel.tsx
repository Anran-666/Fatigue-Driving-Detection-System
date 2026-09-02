
import React from 'react';
import { SystemHealth, ComponentStatus } from '../types';
import { ChipIcon } from './icons';

interface SystemHealthPanelProps {
  healthData: SystemHealth;
}

const StatusIndicator: React.FC<{ status: ComponentStatus }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-gray-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };
  return <span className={`w-3 h-3 rounded-full ${getStatusColor()}`}></span>;
};

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ healthData }) => {
  const components = [
    { name: '主控单元 (MCU)', data: healthData.mcu },
    { name: 'GPS 模块', data: healthData.gps },
    { name: '陀螺仪', data: healthData.gyroscope },
    { name: '存储单元', data: healthData.storage },
    { name: '后端服务 (API)', data: healthData.server },
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <ChipIcon className="w-5 h-5 mr-2 text-gray-400" />
        系统健康状态
      </h3>
      <div className="space-y-3">
        {components.map((component, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <StatusIndicator status={component.data.status} />
              <span className="ml-3 text-gray-300">{component.name}</span>
            </div>
            <span className="text-gray-400 font-mono text-xs">
                {component.data.status === 'error' && component.name.includes('后端') 
                    ? '请运行: npm install && node server/server.js' 
                    : component.data.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SystemHealthPanel);
