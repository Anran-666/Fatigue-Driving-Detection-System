import React from 'react';
import { Intervention, LogEntry, FatigueLevel } from '../types';
import { BellIcon, LogIcon } from './icons';

interface InterventionPanelProps {
  intervention: Intervention;
  log: LogEntry[];
}

const InterventionPanel: React.FC<InterventionPanelProps> = ({ intervention, log }) => {
  const getInterventionStyles = (level: FatigueLevel) => {
    switch (level) {
      case FatigueLevel.Severe:
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          text: 'text-red-400',
          iconBg: 'bg-red-500',
        };
      case FatigueLevel.Medium:
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          iconBg: 'bg-yellow-500',
        };
      case FatigueLevel.Light:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500',
          text: 'text-blue-400',
          iconBg: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500',
          text: 'text-green-400',
          iconBg: 'bg-green-500',
        };
    }
  };

  const styles = getInterventionStyles(intervention.level);

  const getLogLevelColor = (level: FatigueLevel) => {
    switch (level) {
        case FatigueLevel.Severe: return 'text-red-400';
        case FatigueLevel.Medium: return 'text-yellow-400';
        case FatigueLevel.Light: return 'text-blue-400';
        default: return 'text-gray-400';
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div key={intervention.message} className={`p-6 rounded-2xl border ${styles.bg} ${styles.border} mb-6 animate-fade-in`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${styles.iconBg}`}>
            <BellIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${styles.text}`}>当前干预措施</h3>
            <p className="text-gray-200 text-sm">{intervention.message}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <LogIcon className="w-5 h-5 mr-2 text-gray-400"/>
            事件日志
        </h3>
        <div className="space-y-3">
          {log.length > 0 ? log.map((entry, index) => (
            <div key={index} className="flex text-sm">
              <span className="text-gray-500 mr-3">{entry.timestamp}</span>
              <p className={`${getLogLevelColor(entry.level)}`}>{entry.message}</p>
            </div>
          )) : (
            <p className="text-gray-500 text-sm">暂无近期事件。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(InterventionPanel);