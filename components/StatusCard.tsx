
import React from 'react';

interface StatusCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  color?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, unit, icon, color = 'text-gray-100' }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-gray-700 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {value}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
};

export default React.memo(StatusCard);