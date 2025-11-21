
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ScanItem } from '../types';
import { ScanService } from '../services/scanService';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

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
      status: 'idle'
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const addGeneratedItem = useCallback((url: string) => {
    const newItem: ScanItem = {
      id: uuidv4(),
      originalUrl: url,
      name: `AI_Sample_${Date.now().toString().slice(-4)}.png`,
      status: 'idle'
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
             throw new Error("Failed to prepare image for upload");
           }
        }

        if (!remotePath) {
           throw new Error("Upload returned no path");
        }

        // 2. Inference Phase (Upload complete, starting detection)
        updateItemStatus(itemId, 'detecting', { remoteUrl: remotePath });

        // Pass the single remote path to the prediction API
        const results = await ScanService.predictAndCrop([remotePath]);
        
        if (results && results.length > 0) {
           const result = results[0];
           // 3. Completion Phase
           updateItemStatus(itemId, 'cropped', {
             previewUrl: result.predict_img, // Detection visualization
             croppedUrl: result.crop_img,    // Final cropped result
           });
           
           // 4. Notification
           addNotification(`图片 ${currentItem.name} 处理完成`, 'success');
        } else {
           throw new Error("No results returned from API");
        }

      } catch (error: any) {
        console.error(`Processing failed for ${currentItem.name}`, error);
        updateItemStatus(itemId, 'error', { errorMessage: error.message });
        addNotification(`图片 ${currentItem.name} 处理失败`, 'error');
      }
      
      // Optional: Short delay for better UI pacing
      await new Promise(r => setTimeout(r, 300));
    }

    setIsProcessing(false);

  }, [addNotification]); // Dependency reduced to stable addNotification

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
    resetAll
  };
};
