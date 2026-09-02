import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Settings, FatigueLevel } from '../types';

interface FatigueChartProps {
  historyData: number[];
  predictionData: number[];
  settings: Settings;
}

const getFatigueLevel = (index: number, settings: Settings): FatigueLevel => {
    if (index >= settings.heavyThreshold) return FatigueLevel.Severe;
    if (index >= settings.mediumThreshold) return FatigueLevel.Medium;
    if (index >= settings.lightThreshold) return FatigueLevel.Light;
    return FatigueLevel.Awake;
};

const getFatigueLevelTextColor = (level: FatigueLevel) => {
    switch (level) {
        case FatigueLevel.Severe: return 'text-red-400';
        case FatigueLevel.Medium: return 'text-yellow-400';
        case FatigueLevel.Light: return 'text-blue-400';
        default: return 'text-green-400';
    }
}

const getFatigueLevelHexColor = (level: FatigueLevel): string => {
    switch (level) {
        case FatigueLevel.Severe: return '#F56565'; // Red
        case FatigueLevel.Medium: return '#FBBF24'; // Yellow
        case FatigueLevel.Light: return '#60A5FA'; // Blue
        default: return '#4ADE80'; // Green
    }
}

const CustomTooltip = ({ active, payload, label, settings }: any) => {
  if (active && payload && payload.length) {
    const validPayload = payload.filter(p => p.value !== null && p.value !== undefined);
    if (validPayload.length === 0) return null;

    const point = validPayload[0];
    const value = point.value;
    const level = getFatigueLevel(value, settings);
    const name = point.name;
    const color = point.stroke;

    const tooltipColor = color === 'url(#predictionGradient)' ? getFatigueLevelHexColor(level) : color;

    return (
      <div className="bg-gray-700/80 backdrop-blur-sm p-3 rounded-lg border border-gray-600 shadow-lg">
        <p className="text-sm text-gray-300 mb-1">{`时间点: ${label}`}</p>
        <p className="font-bold" style={{ color: tooltipColor }}>{`${name}: ${value.toFixed(1)}`}</p>
        <p className={`text-xs ${getFatigueLevelTextColor(level)}`}>{`状态: ${level}`}</p>
      </div>
    );
  }
  return null;
};

const FatigueChart: React.FC<FatigueChartProps> = ({ historyData, predictionData, settings }) => {
  // FIX: Explicitly type the `data` array. TypeScript inferred a type that did not include '预测疲劳值', causing an error when the property was added later.
  const data: {
    time: string;
    '疲劳指数'?: number;
    '预测疲劳值'?: number;
  }[] = historyData.map((value, index) => ({
    time: `t-${historyData.length - index - 1}`,
    '疲劳指数': value,
  }));

  if (data.length > 0 && predictionData.length > 0) {
    const lastHistoryValue = data[data.length - 1]['疲劳指数'];
    // The connection point has both history and prediction values
    data[data.length - 1]['预测疲劳值'] = lastHistoryValue;

    // Add future points
    predictionData.forEach((value, index) => {
      data.push({
        time: `t+${index + 1}`,
        '疲劳指数': undefined, // Use undefined so recharts skips it
        '预测疲劳值': value,
      });
    });
  }

  // Create dynamic gradient for prediction line
  const lastHistoryValue = historyData.length > 0 ? historyData[historyData.length - 1] : 0;
  const lastPredictionValue = predictionData.length > 0 ? predictionData[predictionData.length - 1] : lastHistoryValue;

  const startLevel = getFatigueLevel(lastHistoryValue, settings);
  const endLevel = getFatigueLevel(lastPredictionValue, settings);

  const startGradientColor = getFatigueLevelHexColor(startLevel);
  const endGradientColor = getFatigueLevelHexColor(endLevel);


  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg h-96">
        <h3 className="text-lg font-semibold text-white mb-4">疲劳趋势与预测</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="predictionGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor={startGradientColor} stopOpacity={0.9}/>
              <stop offset="95%" stopColor={endGradientColor} stopOpacity={0.9}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="time" stroke="#A0AEC0" tick={{ fill: '#A0AEC0', fontSize: 12 }} interval={2}/>
          <YAxis domain={[0, 100]} stroke="#A0AEC0" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
          
          <Tooltip content={<CustomTooltip settings={settings} />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }} />

          {/* 疲劳区域 */}
          <ReferenceArea y1={0} y2={settings.lightThreshold} strokeOpacity={0.1} fill="rgba(74, 222, 128, 0.05)" />
          <ReferenceArea y1={settings.lightThreshold} y2={settings.mediumThreshold} strokeOpacity={0.1} fill="rgba(96, 165, 250, 0.1)" />
          <ReferenceArea y1={settings.mediumThreshold} y2={settings.heavyThreshold} strokeOpacity={0.1} fill="rgba(251, 191, 36, 0.1)" />
          <ReferenceArea y1={settings.heavyThreshold} y2={100} strokeOpacity={0.1} fill="rgba(245, 101, 101, 0.15)" />
          
          <Legend wrapperStyle={{ color: '#E2E8F0', paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="疲劳指数"
            stroke="#4299E1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#4299E1', stroke: '#1A202C', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="预测疲劳值"
            stroke="url(#predictionGradient)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 5, stroke: '#1A202C', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(FatigueChart);