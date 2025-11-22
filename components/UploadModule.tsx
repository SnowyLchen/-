
import React, { useState, useEffect } from 'react';
import { ScanItem } from '../types';
import { generateSampleScan } from '../services/geminiService';
import { Upload, Sparkles, Loader2, X, Zap, ChevronDown, ChevronUp, FileImage } from 'lucide-react';

interface Props {
  onAddFiles: (files: File[]) => void;
  onAddGenerated: (url: string) => void;
  items: ScanItem[];
  onRemove: (id: string) => void;
  onStartProcessing: () => void;
  isCollapsed?: boolean;
}

const UploadModule: React.FC<Props> = ({ 
  onAddFiles, 
  onAddGenerated, 
  items, 
  onRemove, 
  onStartProcessing,
  isCollapsed = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);

  // Sync internal expanded state when prop changes
  useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const url = await generateSampleScan();
      onAddGenerated(url);
    } catch (err) {
      alert("生成失败，请检查 API Key 是否设置。");
    } finally {
      setIsGenerating(false);
    }
  };

  // Collapsed View
  if (!isExpanded) {
    return (
      <section className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 animate-fade-in overflow-hidden">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs">1</div>
               <h2 className="font-bold text-slate-700">上传扫描件</h2>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileImage className="w-4 h-4" />
              <span>已上传 {items.length} 个文件</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <span>展开编辑</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>
    );
  }

  // Expanded View
  return (
    <section className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">1</div>
          <h2 className="text-xl font-bold text-slate-800">上传扫描件</h2>
        </div>
        {items.length > 0 && isCollapsed && (
           <button 
             onClick={() => setIsExpanded(false)}
             className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
           >
             收起 <ChevronUp className="w-4 h-4" />
           </button>
        )}
      </div>
      
      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300 p-8 text-center hover:border-primary transition-colors relative group">
        <input 
          type="file" 
          multiple 
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none group-hover:scale-105 transition-transform duration-300">
          <div className="bg-blue-50 p-3 rounded-full">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">点击上传或拖拽文件</h3>
            <p className="text-xs text-slate-500">支持 JPG, PNG (最大 10MB)</p>
          </div>
        </div>
      </div>

      {/* AI Generation Option */}
      <div className="flex justify-center">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 hover:text-primary transition-all shadow-sm"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
          <span>使用 Gemini AI 生成测试样本</span>
        </button>
      </div>

      {/* Preview Grid */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-slate-700">待处理文件 ({items.length})</h4>
            <button 
              onClick={() => items.forEach(i => onRemove(i.id))}
              className="text-xs text-red-500 hover:text-red-700"
            >
              清空列表
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {items.map((item) => (
              <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img src={item.originalUrl} alt="preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => onRemove(item.id)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
             <button
              onClick={onStartProcessing}
              className="bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
             >
               <Zap className="w-4 h-4 fill-current" />
               开始自动处理
             </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadModule;
