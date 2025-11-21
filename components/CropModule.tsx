
import React, { useState } from 'react';
import { ScanItem, ProcessedResult } from '../types';
import { Download, AlertCircle, FileArchive, RefreshCw, Check, Eye } from 'lucide-react';
import ComparisonModal from './ComparisonModal';

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

// Helper interface for flattening
interface FlatResult {
    item: ScanItem;
    result: ProcessedResult;
    index: number;
}

const CropModule: React.FC<Props> = ({ items, onReset }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [comparingItem, setComparingItem] = useState<{item: ScanItem, result: ProcessedResult} | null>(null);

  const croppedItems = items.filter(i => i.status === 'cropped');

  // Flatten: 1 ScanItem -> N results
  const flatResults: FlatResult[] = croppedItems.flatMap(item => 
    item.results.map((result, index) => ({ item, result, index }))
  );

  if (croppedItems.length === 0) return null;

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      if (!window.JSZip) {
        alert("JSZip 库未加载。");
        return;
      }

      const zip = new window.JSZip();
      const folder = zip.folder("scanned_docs");

      const promises = flatResults.map(async ({ item, result, index }) => {
        if (result.croppedUrl) {
          try {
            const response = await fetch(result.croppedUrl);
            const blob = await response.blob();
            const ext = item.name.split('.').pop() || 'jpg';
            const suffix = item.results.length > 1 ? `_${index + 1}` : '';
            const name = item.name.replace(`.${ext}`, `_cropped${suffix}.${ext}`);
            folder.file(name, blob);
          } catch (e) {
              console.warn("DL fail", e);
          }
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      if (window.saveAs) {
        window.saveAs(content, "scanmaster_batch_export.zip");
      } else {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scanmaster_batch_export.zip";
        a.click();
        URL.revokeObjectURL(url);
      }

    } catch (e) {
      console.error(e);
      alert("创建压缩包失败。");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pt-8 border-t border-slate-200 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">3</div>
        <h2 className="text-xl font-bold text-slate-800">裁剪结果 & 批量导出</h2>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-800">处理完成</h2>
            <p className="text-green-600">
              成功裁剪 {flatResults.length} 张图片。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            开始新批次
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="bg-primary hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg shadow-md flex items-center gap-2 disabled:opacity-70 transition-all active:scale-95"
          >
            {isZipping ? <span className="animate-pulse">正在打包...</span> : <><FileArchive className="w-4 h-4" /> 批量下载 (.zip)</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {flatResults.map(({ item, result, index }) => (
          <div key={`${item.id}-${index}`} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden group transition-transform hover:-translate-y-1 duration-300 flex flex-col">
            <div className="aspect-[3/4] bg-[url('https://www.transparenttextures.com/patterns/checkerboard-light-gray.png')] relative flex items-center justify-center p-4 overflow-hidden">
              {result.croppedUrl ? (
                <>
                    <img src={result.croppedUrl} alt="cropped" className="max-w-full max-h-full shadow-lg z-10" />
                    {/* Hover Overlay with Action Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                        <button 
                            onClick={() => setComparingItem({ item, result })}
                            className="bg-white text-slate-800 px-4 py-2 rounded-full font-medium shadow-lg transform scale-95 group-hover:scale-100 transition-all flex items-center gap-2 hover:bg-primary hover:text-white"
                        >
                            <Eye className="w-4 h-4" />
                            对比
                        </button>
                    </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-red-400">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <span className="text-xs">失败</span>
                </div>
              )}
            </div>
            <div className="p-3 flex justify-between items-center bg-slate-50 border-t border-slate-100 mt-auto">
               <div className="flex flex-col truncate max-w-[100px]">
                  <span className="text-xs font-medium text-slate-600 truncate" title={item.name}>{item.name}</span>
                  {item.results.length > 1 && <span className="text-[10px] text-slate-400">Crop #{index+1}</span>}
               </div>
               <div className="flex items-center gap-1">
                    {result.croppedUrl && (
                        <>
                        <button
                            onClick={() => setComparingItem({ item, result })}
                            className="text-slate-400 hover:text-primary hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                            title="查看对比"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <a 
                            href={result.croppedUrl} 
                            download={`cropped_${item.name}`}
                            className="text-slate-400 hover:text-primary hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                            title="下载单张"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                        </>
                    )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Modal */}
      {comparingItem && (
        <ComparisonModal 
            item={comparingItem.item} 
            result={comparingItem.result}
            onClose={() => setComparingItem(null)} 
        />
      )}
    </section>
  );
};

export default CropModule;
