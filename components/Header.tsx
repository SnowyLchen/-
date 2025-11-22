import React from 'react';
import { ScanLine, Layers } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">智能扫描<span className="text-primary">助手</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
           <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">文档</a>
           <a href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">价格</a>
           <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600">
             <Layers className="w-3 h-3" />
             v1.0.0 (Beta)
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;