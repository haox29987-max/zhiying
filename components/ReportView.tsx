import React from 'react';
import { AnalysisJob } from '../types';
import { Download, Loader2, ArrowLeft } from 'lucide-react';

interface ReportViewProps {
  job: AnalysisJob;
  onBack: () => void;
  username: string;
  apiBase: string;
}

const ReportView: React.FC<ReportViewProps> = ({ job, onBack, username, apiBase }) => {
  if (job.status !== 'completed' || !job.analysis || !job.metadata) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-24 flex flex-col items-center justify-center min-h-[60vh] relative">
        <button onClick={onBack} className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold transition-colors">
          <ArrowLeft size={20} /> 返回控制台
        </button>
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
        <p className="text-gray-900 font-black text-2xl uppercase tracking-widest text-center">{job.filename}</p>
        <p className="text-indigo-600 text-sm font-bold mt-4 bg-indigo-50 px-6 py-2 rounded-full">后端正在全力处理中，请稍候... ({Math.round(job.progress)}%)</p>
      </div>
    );
  }

  const { metadata, analysis, segments, video_rel_path } = job;
  const score = parseInt(analysis.score || '0');
  const scoreColor = score >= 80 ? "#4f46e5" : (score >= 60 ? "#f59e0b" : "#ef4444");

  // 🔴 核心改动：直接从后端下载包含 HTML、MP4 和 GIF 的完整 ZIP 压缩包
  const handleExportZip = () => {
    window.location.href = `${apiBase}/api/export/${encodeURIComponent(username)}/${job.id}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部导航条 */}
      <div className="flex items-center justify-between bg-white px-8 py-4 rounded-3xl shadow-sm border border-gray-100">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-black transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50">
          <ArrowLeft size={18} /> 返回工作台
        </button>
        <div className="flex gap-4">
          <button onClick={handleExportZip} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <Download size={16} /> 导出完整报告包 (ZIP)
          </button>
        </div>
      </div>

      {/* 以下是原有报告视图，略作排版优化 */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden flex flex-col xl:flex-row shadow-indigo-900/5">
        <div className="xl:w-[320px] bg-slate-950 flex items-center justify-center aspect-video xl:aspect-auto border-r border-gray-100 p-4">
          <video controls className="w-full h-full max-h-[600px] object-contain rounded-2xl" src={video_rel_path} />
        </div>

        <div className="flex-1 p-10 relative">
          <div className="absolute top-10 right-10 w-24 h-24 rounded-[2rem] border-4 flex flex-col items-center justify-center font-black bg-white shadow-2xl" style={{ borderColor: scoreColor, color: scoreColor }}>
            <span className="text-4xl leading-none italic">{score}</span>
            <span className="text-[10px] mt-1 uppercase tracking-tighter">SCORE</span>
          </div>

          <div className="mr-32">
            <h2 className="text-3xl font-black text-gray-900 mb-6">@{metadata.author || '未知'}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-gray-400 font-bold mb-1">类目</p>
                <p className="text-sm font-black text-slate-800">{metadata.category}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-gray-400 font-bold mb-1">产品PID</p>
                <p className="text-sm font-black text-slate-800">{metadata.product_id}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 col-span-2">
                <p className="text-[10px] text-indigo-500 font-bold mb-1">播放量 / 点赞</p>
                <p className="text-sm font-black text-indigo-900">{metadata.stats?.play || 0} / {metadata.stats?.digg || 0}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50/50 rounded-[1.5rem] p-6 border border-slate-100">
                <h4 className="text-xs font-black text-gray-400 mb-3">深度分析总结</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.detail_summary}</p>
              </div>
              <div className="bg-orange-50/50 rounded-[1.5rem] p-6 border border-orange-100">
                <h4 className="text-xs font-black text-orange-400 mb-3">修改与优化建议</h4>
                <p className="text-sm text-orange-900 leading-relaxed font-bold">{analysis.suggestions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
        <div className="px-10 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="text-sm font-black text-gray-600">爆款分镜脚本 (Storyboard)</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400">时间轴</th>
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400">口播与台词</th>
              <th className="px-8 py-4 text-left text-xs font-black text-gray-400">画面脚本</th>
              <th className="px-8 py-4 text-center text-xs font-black text-gray-400 w-64">画面预览</th>
            </tr>
          </thead>
          <tbody>
            {segments?.map((seg, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-indigo-50/20">
                <td className="px-8 py-6 align-top">
                  <div className="text-xs font-black text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg">
                    {seg.start_str} - {seg.end_str}
                  </div>
                </td>
                <td className="px-8 py-6 align-top max-w-[300px]">
                  <p className="text-xs text-gray-400 mb-1">{seg.origin}</p>
                  <p className="text-sm font-bold text-gray-800">{seg.trans}</p>
                </td>
                <td className="px-8 py-6 align-top">
                  <p className="text-sm text-gray-600">{seg.visual}</p>
                </td>
                <td className="px-8 py-6">
                  <img src={seg.gif_path} alt="Shot" className="w-full rounded-xl border border-gray-100 shadow-sm" />
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
