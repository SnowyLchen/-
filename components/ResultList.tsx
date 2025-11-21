
import React, { useState } from 'react';
import { ScanItem, ProcessedResult } from '../types';
import { Loader2, CheckCircle, Download, FileArchive, RefreshCw, ZoomIn, ArrowRight, AlertCircle, Layers } from 'lucide-react';
import ImageViewer from './ImageViewer';

interface Props {
  items: ScanItem[];
  onReset: () => void;
}

declare global {
  interface Window {
    JSZip: any;
    saveAs: any;
  }
}

const ResultList: React.FC<Props> = ({ items, onReset }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [viewingUrl, setViewingUrl] = useState<{url: string, title: string} | null>(null);

  const activeItems = items.filter(i => i.status !== 'idle');

  if (activeItems.length === 0) return null;

  const isProcessing = activeItems.some(i => i.status === 'detecting' || i.status === 'cropping');
  const completedCount = activeItems.filter(i => i.status === 'cropped').length;
  const totalCount = activeItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      if (!window.JSZip) {
        alert("JSZip 库未加载。");
        return;
      }

      const zip = new window.JSZip();
      const folder = zip.folder("processed_scans");

      const promises = activeItems
        .filter(i => i.status === 'cropped')
        .flatMap(item => 
          item.results.map(async (result, index) => {
            if (result.croppedUrl) {
              try {
                const response = await fetch(result.croppedUrl);
                const blob = await response.blob();
                const ext = item.name.split('.').pop() || 'jpg';
                // Handle naming for multiple results
                const suffix = item.results.length > 1 ? `_${index + 1}` : '';
                const name = item.name.replace(`.${ext}`, `_processed${suffix}.${ext}`);
                folder.file(name, blob);
              } catch(e) {
                console.warn("Failed to download", result.croppedUrl);
              }
            }
          })
        );

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      if (window.saveAs) {
        window.saveAs(content, "batch_scans.zip");
      } else {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "batch_scans.zip";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("打包失败");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pt-4 border-t border-slate-200 pb-20">
      
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">智能处理结果 ({completedCount}/{totalCount})</h2>
          </div>
        </div>

        <div className="flex gap-3">
           {isProcessing ? (
             <div className="flex items-center gap-3 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">处理中... {progress}%</span>
             </div>
           ) : (
             <>
                <button
                    onClick={onReset}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 flex items-center gap-2"
                >
                    <RefreshCw className="w-3 h-3" />
                    重置
                </button>
                <button
                    onClick={handleDownloadAll}
                    disabled={completedCount === 0}
                    className="bg-primary hover:bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isZipping ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileArchive className="w-3 h-3" />}
                    批量下载
                </button>
             </>
           )}
        </div>
      </div>

      {/* Comparison List */}
      <div className="grid grid-cols-1 gap-4">
        {activeItems.map((item) => (
          <ComparisonRow 
            key={item.id} 
            item={item} 
            onView={(url, title) => setViewingUrl({url, title})}
          />
        ))}
      </div>

      {viewingUrl && (
        <ImageViewer 
            url={viewingUrl.url} 
            title={viewingUrl.title}
            onClose={() => setViewingUrl(null)} 
        />
      )}

    </section>
  );
};

const ComparisonRow: React.FC<{ 
    item: ScanItem, 
    onView: (url: string, title: string) => void 
}> = ({ item, onView }) => {
  
  const isReady = item.status === 'cropped';
  const isError = item.status === 'error';
  const hasResults = item.results.length > 0;

  // Use first result for preview logic if needed, or original
  const previewImage = hasResults ? item.results[0].previewUrl : item.originalUrl;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[220px]">
        
        {/* File Info Sidebar - Compact */}
        <div className="md:w-40 p-3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col justify-between gap-2 shrink-0">
            <div className="min-w-0">
                <h3 className="font-semibold text-slate-700 text-sm truncate" title={item.name}>{item.name}</h3>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    {item.status === 'detecting' && <span className="text-blue-500">分析中...</span>}
                    {item.status === 'cropping' && <span className="text-purple-500">裁剪中...</span>}
                    {item.status === 'cropped' && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已完成</span>}
                    {item.status === 'error' && <span className="text-red-500">失败</span>}
                </div>
                {hasResults && (
                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{item.results.length} 个结果</span>
                  </div>
                )}
            </div>
            
            {isReady && hasResults && (
                // Just a visual indicator, action is in the main view
                <div className="text-[10px] text-slate-400">
                   右侧查看结果
                </div>
            )}
        </div>

        {/* Visual Area */}
        <div className="flex-1 flex relative overflow-hidden">
            
            {/* Left: Original/Detected */}
            <div className="flex-1 relative bg-slate-100/50 border-r border-slate-100 group">
                
                <div className="w-full h-full p-2 flex items-center justify-center relative">
                    <div className="relative h-full max-w-full">
                        {/* Show preview image which has detection boxes usually */}
                        <img 
                            src={item.status === 'detecting' ? item.originalUrl : previewImage} 
                            alt="Original" 
                            className="max-w-full max-h-full object-contain block mx-auto"
                        />
                        
                        {item.status === 'detecting' && (
                             <div className="absolute inset-0 bg-blue-500/10 animate-pulse z-30"></div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => onView(previewImage, `${item.name} - 识别预览`)}
                    className="absolute bottom-2 right-2 p-1 bg-white/90 rounded shadow-sm text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ZoomIn className="w-3 h-3" />
                </button>
            </div>

            {/* Center Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white rounded-full p-1 shadow-sm border border-slate-100 text-slate-300">
                <ArrowRight className="w-3 h-3" />
            </div>

            {/* Right: Cropped Result(s) */}
            <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard-light-gray.png')] group overflow-x-auto">
                
                {isReady && hasResults ? (
                    <div className={`w-full h-full p-2 flex items-center ${item.results.length > 1 ? 'justify-start gap-2 overflow-x-auto px-4' : 'justify-center'}`}>
                        {item.results.map((res, idx) => (
                            <div key={idx} className="relative shrink-0 h-full flex items-center">
                                <img 
                                    src={res.croppedUrl} 
                                    alt={`Result ${idx}`} 
                                    className="max-w-full max-h-[180px] object-contain shadow-sm cursor-pointer hover:scale-[1.02] transition-transform border border-slate-200 bg-white"
                                    onClick={() => onView(res.croppedUrl, `${item.name} - 结果 ${idx + 1}`)}
                                />
                                <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1">#{idx+1}</div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <AlertCircle className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">处理失败</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 w-full">
                        {item.status === 'cropping' || item.status === 'detecting' ? (
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                            <div className="w-8 h-12 border-2 border-dashed border-slate-200 rounded-sm"></div>
                        )}
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};

export default ResultList;
