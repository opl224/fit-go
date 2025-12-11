
import React, { useRef, useState } from 'react';
import { ArrowLeft, History, MapPin, ChevronRight, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { RunSession, UnitSystem } from '../types';
import { formatTime, getDistanceDisplay, getPaceDisplay } from '../utils';

interface HistoryScreenProps {
  onBack: () => void;
  runHistory: RunSession[];
  unitSystem: UnitSystem;
  t: any;
  onHistorySelect: (session: RunSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  getTranslatedRunType: (type: string) => string;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onBack,
  runHistory,
  unitSystem,
  t,
  onHistorySelect,
  onDeleteSession,
  onExportData,
  onImportData,
  getTranslatedRunType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      setDeletingId(id);
      // Brief delay to allow "disappearing" effect before state update
      setTimeout(() => {
          onDeleteSession(id);
          setDeletingId(null);
      }, 300);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">
        <div className="p-6 pt-12 flex items-center bg-white dark:bg-gray-900 shadow-xl z-20 border-b border-gray-100 dark:border-gray-800 rounded-b-[64px] pb-12 transition-all">
             <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
             </button>
             <span className="mx-auto font-black text-lg text-gray-900 dark:text-white uppercase tracking-[0.2em]">{t.history}</span>
             <div className="w-9"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-24 -mt-4 z-10">
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-[32px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider">{t.syncData}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{t.backupInfo}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onExportData} className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700/50 py-3 rounded-2xl active:scale-95 transition-all group">
                        <Download size={16} className="text-blue-600 group-active:translate-y-0.5 transition-transform" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase">{t.exportData}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700/50 py-3 rounded-2xl active:scale-95 transition-all group">
                        <Upload size={16} className="text-purple-600 group-active:-translate-y-0.5 transition-transform" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase">{t.importData}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                </div>
            </div>

            {runHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-4">
                    <History size={48} className="opacity-10" />
                    <p className="font-black uppercase tracking-widest text-xs opacity-40">{t.noRuns}</p>
                </div>
            ) : (
                runHistory.map(session => {
                    const isDeleting = deletingId === session.id;
                    const paceSecondsPerKm = session.distance > 0 ? session.duration / session.distance : 0;
                    const displayDistance = getDistanceDisplay(session.distance, unitSystem);
                    const displayPace = getPaceDisplay(paceSecondsPerKm, unitSystem);
                    const date = new Date(session.startTime);
                    return (
                        <div 
                            key={session.id} 
                            onClick={() => onHistorySelect(session)} 
                            className={`bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer group hover:border-blue-500/50 relative ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900/40 rounded-2xl flex items-center justify-center">
                                        <MapPin size={22} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{getTranslatedRunType(session.type)}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => handleDelete(e, session.id)}
                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl active:scale-90 transition-transform hover:bg-red-100 border border-red-100 dark:border-red-900/20 shadow-sm z-20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                                        <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-5">
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-black text-gray-400 mb-1 tracking-widest">{t.distance}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{displayDistance.value} <span className="text-[10px] text-gray-400">{displayDistance.unit}</span></p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-black text-gray-400 mb-1 tracking-widest">{t.duration}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{formatTime(session.duration)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] uppercase font-black text-gray-400 mb-1 tracking-widest">{t.pace}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{displayPace}</p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
