
import React from 'react';
import { X, Download, ArrowRight, ScanLine } from 'lucide-react';
import { ScanItem, ProcessedResult } from '../types';

interface Props {
  item: ScanItem;
  result: ProcessedResult;
  onClose: () => void;
}

const ComparisonModal: React.FC<Props> = ({ item, result, onClose }) => {
  if (!result.croppedUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
      <div className="bg-white w-full max-w-7xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-lg text-primary">
                <ScanLine className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">效果对比</h3>
                <p className="text-xs text-slate-500">文件名: {item.name}</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 relative">
          
          {/* Original */}
          <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 relative group">
            <div className="absolute top-6 left-6 z-10 bg-slate-800/80 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              原始识别
            </div>
            <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden rounded-lg bg-slate-100 border border-slate-200/50">
                 <img 
                  src={result.previewUrl || item.originalUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                 />
            </div>
          </div>

          {/* Center Divider / Arrow */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-slate-200 text-slate-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Result */}
          <div className="flex-1 p-6 flex flex-col relative group bg-[url('https://www.transparenttextures.com/patterns/checkerboard-light-gray.png')]">
             <div className="absolute top-6 right-6 z-10 bg-green-600/90 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                裁剪结果
             </div>
             <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden rounded-lg border border-slate-200/50 bg-white/50 backdrop-blur-sm shadow-sm">
                <img 
                  src={result.croppedUrl} 
                  alt="Result" 
                  className="max-w-full max-h-full object-contain shadow-xl transition-transform duration-500 group-hover:scale-[1.02]" 
                />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="text-sm text-slate-500">
             <span className="hidden md:inline">提示：左右两侧分别展示处理前后的效果。</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                关闭
            </button>
            <a 
                href={result.croppedUrl} 
                download={`cropped_${item.name}`}
                className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95"
            >
                <Download className="w-4 h-4" />
                下载此图
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
