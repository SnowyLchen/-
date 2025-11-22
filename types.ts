
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'detecting' | 'detected' | 'cropping' | 'cropped' | 'error';

export interface BackendScanResult {
  img: string;         // Original image URL from server or base64
  predict_img: string; // Image with detection visualization
  crop_img: string;    // Primary cropped image
  all_crop_imgs?: string[]; // List of all cropped images found
}

export interface ProcessedResult {
  img?: string;
  previewUrl: string;
  croppedUrl: string;
}

export interface ScanItem {
  id: string;
  file?: File; 
  originalUrl: string;
  remoteUrl?: string; // Path on the server after upload
  name: string;
  status: ProcessingStatus;
  results: ProcessedResult[]; // Support multiple results per item
  boundingBox?: BoundingBox;
  width?: number;
  height?: number;
  errorMessage?: string;
}

export enum AppStep {
  UPLOAD = 0,
  DETECT = 1,
  CROP = 2,
}

// Re-export network types if needed globally
export type { ApiResponse } from './utils/network';
