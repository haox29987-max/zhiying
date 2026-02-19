
import React from 'react';
import { AnalysisJob } from '../types';
import { RotateCcw, XCircle, AlertCircle, Trash2 } from 'lucide-react';

interface TrashManagerProps {
  jobs: AnalysisJob[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onClearAll: () => void;
}

const TrashManager: React.FC<TrashManagerProps> = ({ jobs, onRestore, onPermanentDelete, onClearAll }) => {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-12 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 select-none">
        <div className="cursor-default">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Trash2 className="text-red-500" /> 回收站
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <AlertCircle size={12} className="text-amber-500" /> 项目在 3 天后将被系统永久粉碎
          </p>
        </div>
        
        {jobs.length > 0 && (
          <button 
            onClick={onClearAll}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-lg shadow-red-100/50 uppercase tracking-widest select-none"
          >
            一键清空回收站
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
        {jobs.map(job => {
          const daysLeft = 3 - Math.floor((Date.now() - (job.deletedAt || 0)) / (1000 * 60 * 60 * 24));
          return (
            <div key={job.id} className="group bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-50 select-none cursor-default">
                  <Trash2 size={24} />
                </div>
                <div className="select-none cursor-default">
                  <h4 className="text-lg font-black text-slate-900">{job.filename}</h4>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">
                    剩余保存时间: {daysLeft < 1 ? '不足 24 小时' : `${daysLeft} 天`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                <button 
                  onClick={() => onRestore(job.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                >
                  <RotateCcw size={14} /> 恢复项目
                </button>
                <button 
                  onClick={() => onPermanentDelete(job.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-red-400 rounded-2xl text-xs font-black hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                >
                  <XCircle size={14} /> 永久粉碎
                </button>
              </div>
            </div>
          );
        })}

        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-200 select-none cursor-default">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 size={32} />
             </div>
             <p className="text-xl font-black italic tracking-tighter text-slate-300">TRASH IS EMPTY</p>
             <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-slate-300">回收站内空空如也</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashManager;