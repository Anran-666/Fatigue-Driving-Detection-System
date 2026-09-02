import React from 'react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl text-white relative transform transition-all duration-300 ease-in-out scale-95 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-300">动态权重自适应融合框架</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 relative">
                <div className="absolute -top-5 -left-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg">
                    01
                </div>
                <div className="pt-8">
                    <h3 className="text-xl sm:text-2xl font-semibold text-blue-300 mb-4">实时调整权重</h3>
                    <p className="text-gray-300 leading-relaxed">
                        系统每30秒计算视觉清晰度方差与方向盘熵值，量化当前环境置信度，实时调整权重（逆光场景视觉权重自动下调至0.3，方向盘与踏板权重升至0.7）。
                    </p>
                </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 relative">
                 <div className="absolute -top-5 -left-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg">
                    02
                </div>
                <div className="pt-8">
                    <h3 className="text-xl sm:text-2xl font-semibold text-blue-300 mb-4">疲劳预测模型优化</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                        采用改进注意力机制的 CNN-LSTM 网络，模型参数量减少60%，可在边缘端50ms内完成计算，显著提升了系统的实时性和适应性。
                    </p>
                    <div className="bg-blue-900/30 border-l-4 border-blue-400 text-blue-200 p-3 rounded-r-lg text-sm">
                        <p><strong>CNN</strong> 擅长提取空间特征，<strong>LSTM</strong> 适合处理时序数据，结合改进的注意力机制后，模型能更精准地关注关键特征。</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={onClose} className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-300">关闭</button>
        </div>
        
        {/* Add animation style */}
        <style>{`
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal-enter {
            animation: modal-enter 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default SystemInfoModal;