
import React from 'react';
import { AnalysisJob } from '../types';
import { Download, Share2, Loader2, PlayCircle } from 'lucide-react';

interface ReportViewProps {
  job: AnalysisJob;
}

const ReportView: React.FC<ReportViewProps> = ({ job }) => {
  if (job.status !== 'completed' || !job.analysis || !job.metadata) {
    const getStatusText = (status: string) => {
      switch (status) {
        case 'scraping': return '正在爬取视频源数据...';
        case 'downloading': return '正在高速下载原始素材...';
        case 'analyzing': return '智囊模型正在进行深度逻辑拆解...';
        default: return '任务已进入队列，等待处理...';
      }
    };

    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-24 h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 select-none">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 size={32} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4 cursor-default">
          <div className="space-y-1">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Processing Task</p>
            <p className="text-gray-900 font-black text-2xl italic tracking-tight uppercase">{job.filename}</p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-indigo-600 text-sm font-bold flex items-center gap-2 bg-indigo-50 px-6 py-2 rounded-full">
              {getStatusText(job.status)}
            </p>
            <div className="w-64 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4 border border-gray-50">
               <div 
                 className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                 style={{ width: `${job.progress}%` }}
               />
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">进度: {Math.round(job.progress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  const { metadata, analysis, segments, video_rel_path } = job;
  const score = parseInt(analysis.score);
  const scoreColor = score >= 80 ? "#4f46e5" : (score >= 60 ? "#f59e0b" : "#ef4444");

  const handleExport = () => {
    const reportData = {
      ...job,
      exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${metadata.author}_${metadata.product_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden flex flex-col xl:flex-row shadow-indigo-900/5">
        {/* Video Player Section */}
        <div className="xl:w-[320px] bg-slate-950 flex items-center justify-center aspect-video xl:aspect-auto border-r border-gray-100">
          <video 
            controls 
            className="w-full h-full max-h-[600px] object-contain"
            src={video_rel_path}
          />
        </div>

        {/* Dashboard Section */}
        <div className="flex-1 p-10 relative">
          {/* Action Buttons */}
          <div className="absolute top-10 right-10 flex gap-2 select-none">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <Download size={14} /> 导出报告
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-black hover:bg-gray-100 transition-all border border-gray-100">
              <Share2 size={14} /> 分享
            </button>
          </div>

          <div 
            className="absolute top-10 left-10 w-20 h-20 rounded-[1.8rem] border-4 flex flex-col items-center justify-center font-black bg-white shadow-2xl shadow-indigo-100 select-none cursor-default"
            style={{ borderColor: scoreColor, color: scoreColor }}
          >
            <span className="text-3xl leading-none italic">{score}</span>
            <span className="text-[10px] mt-1 uppercase tracking-tighter">SCORE</span>
          </div>

          <div className="ml-24 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight select-all cursor-text">@{metadata.author}</h2>
              <a 
                href={metadata.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-[10px] font-black bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-lg shadow-indigo-600/20 select-none"
              >
                🔗 VIEW ORIGIN
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10 select-none cursor-default">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                <p className="text-sm font-black text-slate-800">{metadata.category}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">PID</p>
                <p className="text-sm font-black text-amber-900">{metadata.product_id}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Stats</p>
                <p className="text-sm font-black text-indigo-900 italic">{(metadata.stats.play / 10000).toFixed(1)}w Play</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="flex items-center text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 select-none cursor-default">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></span>
                  Logic Summary
                </h4>
                <div className="bg-slate-50/50 rounded-[1.5rem] p-6 text-sm text-slate-600 font-medium leading-relaxed border border-slate-100 italic select-text cursor-text">
                  "{analysis.detail_summary}"
                </div>
              </div>

              <div>
                <h4 className="flex items-center text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 select-none cursor-default">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></span>
                  Recommendations
                </h4>
                <div 
                  className="bg-orange-50/30 rounded-[1.5rem] p-6 text-sm text-orange-900 font-bold leading-relaxed border border-orange-100/50 select-text cursor-text"
                  dangerouslySetInnerHTML={{ __html: analysis.suggestions }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden shadow-indigo-900/5">
        <div className="px-10 py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center select-none cursor-default">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">爆款分镜脚本 (STORYBOARD)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-gray-100 select-none cursor-default">
              <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">TIMELINE</th>
              <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">TRANSCRIPT</th>
              <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">VISUAL SCRIPT</th>
              <th className="px-10 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] w-56">AI SHOT</th>
            </tr>
          </thead>
          <tbody>
            {segments?.map((seg, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-indigo-50/10 transition-colors group">
                <td className="px-10 py-8 align-top select-none cursor-default">
                  <div className="text-xs font-black text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg">
                    {seg.start_str}
                  </div>
                </td>
                <td className="px-10 py-8 border-r border-dashed border-gray-100 max-w-[320px]">
                  <p className="text-[10px] text-gray-300 mb-2 font-bold uppercase tracking-widest select-none cursor-default">{seg.origin}</p>
                  <p className="text-sm font-black text-slate-800 leading-snug select-text cursor-text">{seg.trans}</p>
                </td>
                <td className="px-10 py-8">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed select-text cursor-text">{seg.visual}</p>
                </td>
                <td className="px-10 py-8 text-center select-none">
                  <div className="relative group/gif overflow-hidden rounded-2xl shadow-lg border-2 border-white group-hover:border-indigo-100 transition-all">
                    <img 
                      src={seg.gif_path} 
                      alt="Shot" 
                      className="w-full aspect-[4/3] object-cover group-hover/gif:scale-110 transition-transform duration-700" 
                      loading="lazy" 
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportView;