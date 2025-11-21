
import React, { useRef, useEffect } from 'react';
import { useProcessingQueue } from './hooks/useProcessingQueue';

// Components
import Header from './components/Header';
import UploadModule from './components/UploadModule';
import ResultList from './components/ResultList';
import ToastContainer from './components/Toast';

const App: React.FC = () => {
  const {
    items,
    isProcessing,
    hasStarted,
    notifications,
    removeNotification,
    addFiles,
    addGeneratedItem,
    removeItem,
    startProcessing,
    retryItem,
    resetAll
  } = useProcessingQueue();
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when processing starts
  useEffect(() => {
    if (hasStarted && isProcessing) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [hasStarted, isProcessing]);

  const handleReset = () => {
    if (window.confirm("确定要开始新批次吗？当前的所有结果将被清除。")) {
      resetAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Module 1: Upload */}
        <UploadModule 
          items={items}
          onAddFiles={addFiles}
          onAddGenerated={addGeneratedItem}
          onRemove={removeItem}
          onStartProcessing={startProcessing}
          isCollapsed={hasStarted}
        />

        {/* Module 2: Results List (Merged Detection & Crop) */}
        <div ref={resultsRef}>
          <ResultList 
            items={items}
            onReset={handleReset}
            onRetry={retryItem}
          />
        </div>

      </main>
      
      {/* Notifications */}
      <ToastContainer 
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
};

export default App;
