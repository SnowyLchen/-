
import React from 'react';
import { ScanItem } from '../types';
import { CheckCircle, Loader2, Scissors } from 'lucide-react';

interface Props {
  items: ScanItem[];
  onCrop: () => void;
}

const DetectionModule: React.FC<Props> = ({ items, onCrop }) => {
  const activeItems = items.filter(i => i.status !== 'idle');
  
  if (activeItems.length === 0) return null;

  const isAllDetected = activeItems.every(i => i.status === 'detected' || i.status === 'cropped' || i.status === 'error');
  const processingCount = activeItems.filter(i => i.status === 'detecting' || i.status === 'uploading').length;

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pt-8 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">2</div>
        <h2 className="text-xl font-bold text-slate-800">自动识别边界</h2>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-40">
        <div>
          <p className="text-slate-600 text-sm font-medium">
            {processingCount > 0 
              ? <span className="flex items-center gap-2 text-blue-600"><Loader2 className="w-4 h-4 animate-spin" /> 正在处理 {processingCount} 张图片 (上传/识别中)...</span>
              : <span className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" /> 所有图片识别完成</span>}
          </p>
        </div>
        <button
          onClick={onCrop}
          disabled={!isAllDetected}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
            isAllDetected 
              ? 'bg-primary text-white shadow-md hover:bg-blue-600 active:scale-95' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Scissors className="w-4 h-4" />
          查看结果
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeItems.map((item) => (
          <DetectionCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

const DetectionCard: React.FC<{ item: ScanItem }> = ({ item }) => {
  // If we have results, use the first one's previewUrl (which typically shows the red boxes)
  // otherwise fallback to originalUrl
  const displayUrl = (item.results && item.results.length > 0) 
    ? item.results[0].previewUrl 
    : item.originalUrl;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col h-[400px] transition-all hover:shadow-md">
      <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
        <img 
          src={displayUrl} 
          alt="scan" 
          className="w-full h-full object-contain"
        />
        
        {/* Scanning Animation */}
        {(item.status === 'detecting' || item.status === 'uploading') && (
          <div className="absolute inset-0 z-10 pointer-events-none">
             <div className="absolute w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
             <div className="absolute inset-0 bg-blue-500/10"></div>
             {item.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">上传中...</span>
                </div>
             )}
          </div>
        )}

        {/* Detected Badge */}
        {(item.status === 'detected' || item.status === 'cropped') && (
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded shadow-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              边界已识别
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]" title={item.name}>{item.name}</span>
        <div className="flex items-center gap-2">
           {item.status === 'uploading' && <span className="text-xs text-blue-500 font-medium flex gap-1 items-center"><Loader2 className="w-3 h-3 animate-spin"/> 上传...</span>}
           {item.status === 'detecting' && <span className="text-xs text-blue-500 font-medium flex gap-1 items-center"><Loader2 className="w-3 h-3 animate-spin"/> 识别中...</span>}
           {(item.status === 'detected' || item.status === 'cropped') && <span className="text-xs text-green-600 font-medium flex gap-1 items-center"><CheckCircle className="w-3 h-3"/> 就绪</span>}
           {item.status === 'error' && <span className="text-xs text-red-500 font-medium">失败</span>}
        </div>
      </div>
    </div>
  );
};

export default DetectionModule;
