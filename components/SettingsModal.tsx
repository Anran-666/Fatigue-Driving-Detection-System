import React, { useState, useEffect } from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(currentSettings);
    onClose();
  };
  
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let newSettings = { ...currentSettings, [name]: Number(value) };

      if (name === 'lightThreshold') {
          if (Number(value) >= newSettings.mediumThreshold) {
              newSettings.mediumThreshold = Number(value) + 1;
          }
          if (newSettings.mediumThreshold >= newSettings.heavyThreshold) {
              newSettings.heavyThreshold = newSettings.mediumThreshold + 1;
          }
      } else if (name === 'mediumThreshold') {
          if (Number(value) <= newSettings.lightThreshold) {
              newSettings.lightThreshold = Number(value) - 1;
          }
          if (Number(value) >= newSettings.heavyThreshold) {
              newSettings.heavyThreshold = Number(value) + 1;
          }
      } else if (name === 'heavyThreshold') {
          if (Number(value) <= newSettings.mediumThreshold) {
              newSettings.mediumThreshold = Number(value) - 1;
          }
          if (newSettings.mediumThreshold <= newSettings.lightThreshold) {
              newSettings.lightThreshold = newSettings.mediumThreshold - 1;
          }
      }
      
      setCurrentSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-white">
        <h2 className="text-2xl font-bold mb-6">系统设置</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-400 mb-2">疲劳阈值</label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>轻度</span>
                <input type="range" min="1" max="100" name="lightThreshold" value={currentSettings.lightThreshold} onChange={handleThresholdChange} className="w-1/2" />
                <span>{currentSettings.lightThreshold}%</span>
              </div>
               <div className="flex items-center justify-between">
                <span>中度</span>
                <input type="range" min="1" max="100" name="mediumThreshold" value={currentSettings.mediumThreshold} onChange={handleThresholdChange} className="w-1/2" />
                <span>{currentSettings.mediumThreshold}%</span>
              </div>
               <div className="flex items-center justify-between">
                <span>重度</span>
                <input type="range" min="1" max="100" name="heavyThreshold" value={currentSettings.heavyThreshold} onChange={handleThresholdChange} className="w-1/2" />
                <span>{currentSettings.heavyThreshold}%</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 space-y-4">
            <div className="flex justify-between items-center">
                <label htmlFor="aromaEnabled" className="text-gray-300">启用提神香氛</label>
                <input type="checkbox" id="aromaEnabled" checked={currentSettings.aromaEnabled} onChange={(e) => setCurrentSettings({...currentSettings, aromaEnabled: e.target.checked})} className="toggle-checkbox" />
            </div>
             <div className="flex justify-between items-center">
                <label htmlFor="laneAssistEnabled" className="text-gray-300">启用车道保持辅助 (重度)</label>
                <input type="checkbox" id="laneAssistEnabled" checked={currentSettings.laneAssistEnabled} onChange={(e) => setCurrentSettings({...currentSettings, laneAssistEnabled: e.target.checked})} className="toggle-checkbox" />
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">取消</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition">保存更改</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;