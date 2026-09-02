import React from 'react';
import { RoadCondition, WeightDistribution } from '../types';
import { CarIcon, CameraIcon } from './icons';

interface WeightAnalysisPanelProps {
  roadCondition: RoadCondition;
  weights: WeightDistribution;
}

const roadConditionMap: { [key in RoadCondition]: string } = {
    Flat: '平直道路',
    Curvy: '弯道场景',
    Bumpy: '颠簸路段',
    Backlit: '逆光场景',
    Tunnel: '隧道',
};


const WeightAnalysisPanel: React.FC<WeightAnalysisPanelProps> = ({ roadCondition, weights }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-1">动态权重分析</h3>
      <p className="text-sm text-gray-400 mb-4">当前场景: <span className="font-semibold text-blue-300">{roadConditionMap[roadCondition]}</span></p>

      <div className="space-y-4">
        {/* Visual Data Weight */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-300 flex items-center">
                <CameraIcon className="w-4 h-4 mr-2 text-blue-400" />
                视觉感知数据
            </span>
            <span className="text-sm font-bold text-blue-300">{`${(weights.visual * 100).toFixed(0)}%`}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${weights.visual * 100}%` }}></div>
          </div>
        </div>

        {/* Vehicle Data Weight */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-300 flex items-center">
                <CarIcon className="w-4 h-4 mr-2 text-green-400"/>
                车辆总线数据
            </span>
            <span className="text-sm font-bold text-green-300">{`${(weights.vehicle * 100).toFixed(0)}%`}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${weights.vehicle * 100}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">
            <span className="font-semibold">分析: </span>
            {weights.justification}
        </p>
      </div>
    </div>
  );
};

export default React.memo(WeightAnalysisPanel);