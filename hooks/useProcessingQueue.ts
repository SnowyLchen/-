
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ScanItem, ProcessedResult } from '../types';
import { ScanService } from '../services/scanService';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// Helper to ensure URL is displayable (simple heuristic)
const formatApiUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  // Fallback: assume base64 if it doesn't look like a path, or if previous logic dictated it.
  // Given previous context, we'll err on the side of adding base64 header if missing for raw data.
  // But if it ends in .jpg/.png, it's likely a path.
  if (url.match(/\.(jpg|jpeg|png|webp)$/i)) {
     // It is a path. If we have a base URL strategy, we would prepend it here.
     // For now, return as is (user might have a proxy or base tag).
     return url;
  }
  // Assume raw base64 data
  return `data:image/png;base64,${url}`;
};

export const useProcessingQueue = () => {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Use a Ref to access the latest items state inside async loops
  const itemsRef = useRef<ScanItem[]>([]);
  
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // --- Notification Helper ---
  const addNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, message, type }]);
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Item Management ---

  const addFiles = useCallback((files: File[]) => {
    const newItems: ScanItem[] = files.map(file => ({
      id: uuidv4(),
      file,
      originalUrl: URL.createObjectURL(file),
      name: file.name,
      status: 'idle',
      results: []
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const addGeneratedItem = useCallback((url: string) => {
    const newItem: ScanItem = {
      id: uuidv4(),
      originalUrl: url,
      name: `AI_Sample_${Date.now().toString().slice(-4)}.png`,
      status: 'idle',
      results: []
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setItems([]);
    setHasStarted(false);
    setIsProcessing(false);
    setNotifications([]);
  }, []);

  // --- Helper to update item status safely ---
  const updateItemStatus = (id: string, status: ScanItem['status'], extra?: Partial<ScanItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, ...extra } : item
    ));
  };

  // --- Sequential Processing Logic ---
  const startProcessing = useCallback(async () => {
    // Identify idle items at the start
    const itemsToProcessIds = itemsRef.current
      .filter(i => i.status === 'idle')
      .map(i => i.id);
    
    if (itemsToProcessIds.length === 0) return;

    setHasStarted(true);
    setIsProcessing(true);

    // Process strictly one by one
    for (const itemId of itemsToProcessIds) {
      
      // Check if item still exists (in case user deleted it while processing others)
      const currentItem = itemsRef.current.find(i => i.id === itemId);
      if (!currentItem) continue;

      try {
        // 1. Upload Phase
        updateItemStatus(itemId, 'uploading');
        
        let remotePath = '';
        
        if (currentItem.file) {
           remotePath = await ScanService.uploadImage(currentItem.file);
        } else if (currentItem.originalUrl) {
           // Handle AI generated blobs or other URLs
           try {
             const blob = await fetch(currentItem.originalUrl).then(r => r.blob());
             const file = new File([blob], currentItem.name, { type: blob.type });
             remotePath = await ScanService.uploadImage(file);
           } catch (e) {
             console.error("Blob conversion failed", e);
             throw new Error("准备图片上传失败");
           }
        }

        if (!remotePath) {
           throw new Error("上传未返回有效路径");
        }

        // 2. Inference Phase (Upload complete, starting detection)
        updateItemStatus(itemId, 'detecting', { remoteUrl: remotePath });

        // Pass the single remote path to the prediction API
        const backendResults = await ScanService.predictAndCrop([remotePath]);
        
        if (backendResults && backendResults.length > 0) {
           // Map backend results to our internal structure
           const processedResults: ProcessedResult[] = backendResults.map(res => ({
              img: res.img,
              previewUrl: formatApiUrl(res.predict_img),
              croppedUrl: formatApiUrl(res.crop_img)
           }));

           // 3. Completion Phase
           updateItemStatus(itemId, 'cropped', {
             results: processedResults
           });
           
           // 4. Notification
           addNotification(`图片 ${currentItem.name} 处理完成`, 'success');
        } else {
           throw new Error("API 未返回处理结果");
        }

      } catch (error: any) {
        console.error(`Processing failed for ${currentItem.name}`, error);
        updateItemStatus(itemId, 'error', { errorMessage: error.message });
        addNotification(`处理失败: ${error.message}`, 'error');
      }
      
      // Optional: Short delay for better UI pacing
      await new Promise(r => setTimeout(r, 300));
    }

    setIsProcessing(false);

  }, [addNotification]);

  const retryItem = useCallback((id: string) => {
    // Reset item status to idle and clear error
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'idle', results: [], errorMessage: undefined } 
        : item
    ));

    // Trigger processing in next tick to ensure state update is reflected
    setTimeout(() => {
      startProcessing();
    }, 100);
  }, [startProcessing]);

  return {
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
  };
};
