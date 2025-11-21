
import { BackendScanResult } from "../types";

// Base URL for API requests. Leave empty to use relative paths (proxy) or set to your backend URL.
const API_BASE_URL = ''; 

/**
 * Service to interact with the Scan Backend API
 */
export const ScanService = {
  
  /**
   * Uploads a single file to the backend.
   * Endpoint: /api/upload
   * Response: { status: "success", local_path: "...", filename: "..." }
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || "Upload failed");
      }

      // Backend returns 'local_path' which represents the absolute path on the server
      const remotePath = data.local_path;
      
      if (!remotePath) {
         throw new Error("Upload successful but no local_path returned");
      }
      
      return remotePath;

    } catch (error) {
      console.error("ScanService Upload Error:", error);
      throw error;
    }
  },

  /**
   * Calls the prediction endpoint with the uploaded image paths.
   * Endpoint: /api/predict_and_crop
   * Payload: { images: ["path/to/file"] }
   * Response: { task_id: "...", results: [...] }
   */
  predictAndCrop: async (remotePaths: string[]): Promise<BackendScanResult[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/predict_and_crop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: remotePaths }),
      });

      if (!response.ok) {
        throw new Error(`Prediction failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // The python backend returns { "task_id": "...", "results": [...] }
      if (data.results) {
          return data.results;
      }
      
      return [];

    } catch (error) {
      console.error("ScanService Predict Error:", error);
      throw error;
    }
  }
};
