
import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { Notification } from '../hooks/useProcessingQueue';

interface Props {
  notifications: Notification[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<Props> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-20 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-fade-in-up
            ${note.type === 'success' 
              ? 'bg-white border-green-100 text-slate-800' 
              : 'bg-white border-red-100 text-slate-800'}
          `}
        >
          {note.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          
          <span className="text-sm font-medium">{note.message}</span>
          
          <button 
            onClick={() => onClose(note.id)}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
