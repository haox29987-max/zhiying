
import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisJob, UserData, AllowedUser } from './types';
import Header from './components/Header';
import AnalysisForm from './components/AnalysisForm';
import JobStatusList from './components/JobStatusList';
import ReportView from './components/ReportView';
import LoginForm from './components/LoginForm';
import AdminPortal from './components/AdminPortal';
import TrashManager from './components/TrashManager';
import { LayoutDashboard, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoggedInAsAdmin, setIsLoggedInAsAdmin] = useState(false);
  const [iconClicks, setIconClicks] = useState(0);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>(() => {
    const saved = localStorage.getItem('cf_allowed_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [jobs, setJobs] = useState<AnalysisJob[]>(() => {
    const saved = localStorage.getItem('cf_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('cf_allowed_users', JSON.stringify(allowedUsers));
  }, [allowedUsers]);

  useEffect(() => {
    localStorage.setItem('cf_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const activeJobs = useMemo(() => jobs.filter(j => !j.deletedAt), [jobs]);
  const trashJobs = useMemo(() => jobs.filter(j => !!j.deletedAt), [jobs]);

  const handleLogoClick = () => {
    setIconClicks(prev => {
      const next = prev + 1;
      if (next >= 7) {
        setIsAdminMode(true);
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (iconClicks > 0) {
      const timer = setTimeout(() => setIconClicks(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [iconClicks]);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedInAsAdmin(false);
    setIsAdminMode(false);
  };

  const startAnalysis = (inputs: { urls: string[], model: string }) => {
    setIsProcessing(true);
    const newJobs: AnalysisJob[] = inputs.urls.map((url, i) => ({
      id: `url-${Date.now()}-${i}`,
      filename: `Video_${url.split('/').pop()?.slice(-6) || 'Clip'}.mp4`,
      status: 'pending' as const,
      progress: 0,
      metadata: { url } as any
    }));
    setJobs(prev => [...newJobs, ...prev]);
    newJobs.forEach(job => simulateJobProcess(job.id));
  };

  const simulateJobProcess = (jobId: string) => {
    const steps: Array<AnalysisJob['status']> = ['scraping', 'downloading', 'analyzing', 'completed'];
    let currentStepIndex = 0;
    const interval = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.id === jobId) {
          const nextStep = steps[currentStepIndex];
          const isDone = currentStepIndex === steps.length - 1;
          if (isDone) {
            clearInterval(interval);
            return {
              ...j, status: 'completed', progress: 100,
              video_rel_path: 'https://www.w3schools.com/html/mov_bbb.mp4',
              metadata: {
                url: 'https://www.tiktok.com/@example/video/123456',
                author: '乘风特约创作者',
                fans: '1.2M+',
                publish_time: '2024-03-22',
                desc: '乘风智影深度分析案例：爆款视频的底层叙事逻辑。',
                music: '原声 - 乘风媒体库',
                category: '商业 / 增长',
                sub_tag: '案例研究',
                product_id: 'CF-8892',
                stats: { play: 1250000, digg: 68000, comment: 2400, share: 1500, collect: 8900 }
              },
              analysis: {
                score: "92",
                short_summary: "极致的情绪曲线引导",
                detail_summary: "该视频通过极简的视觉对齐和快速的音频切分，构建了一个完整的情绪闭环。",
                suggestions: "1. 视频第12秒处可以增加醒目的文字弹窗以增强记忆点。"
              },
              segments: [
                {
                  start_str: "00:00", end_str: "00:04", start_sec: 0, end_sec: 4,
                  origin: "Sticking ideas", trans: "想法深入人心",
                  visual: "动态文字浮现", gif_path: "https://picsum.photos/360/200?random=11"
                }
              ]
            };
          }
          currentStepIndex++;
          return { ...j, status: nextStep, progress: (currentStepIndex / steps.length) * 100 };
        }
        return j;
      }));
    }, 2000);
  };

  const moveToTrash = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, deletedAt: Date.now() } : j));
    if (selectedJobId === id) setSelectedJobId(null);
  };

  const restoreJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, deletedAt: undefined } : j));
  };

  const permanentDelete = (id: string) => {
    if (confirm('确定要永久粉碎此任务吗？此操作无法撤销。')) {
      setJobs(prev => prev.filter(j => j.id !== id));
      if (selectedJobId === id) setSelectedJobId(null);
    }
  };

  const clearTrash = () => {
    if (confirm('确定要清空所有回收站内容吗？')) {
      setJobs(prev => prev.filter(j => !j.deletedAt));
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  if (isLoggedInAsAdmin) {
    return (
      <AdminPortal 
        onLogout={handleLogout} 
        allowedUsers={allowedUsers} 
        setAllowedUsers={setAllowedUsers} 
      />
    );
  }

  if (isAdminMode) {
    return (
      <LoginForm 
        mode="admin" 
        allowedUsers={allowedUsers}
        onLogin={(user) => {
          if (user.username === '超级管理员') setIsLoggedInAsAdmin(true);
          else setCurrentUser(user);
        }} 
        onCancel={() => setIsAdminMode(false)} 
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginForm 
        mode="employee" 
        allowedUsers={allowedUsers}
        onLogin={setCurrentUser} 
        onLogoClick={handleLogoClick} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#fafafa]">
      <Header onLogoClick={handleLogoClick} user={currentUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-6 mt-12 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form and Mini Nav (Wider) */}
          <div className="lg:col-span-5 space-y-8">
            <AnalysisForm 
              onStart={startAnalysis} 
              isProcessing={isProcessing} 
              apiKey={currentUser.apiKey} 
            />
            
            <div className="space-y-4">
              <nav className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button 
                  onClick={() => setViewMode('active')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutDashboard size={14} /> 工作台
                </button>
                <button 
                  onClick={() => setViewMode('trash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'trash' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Trash2 size={14} /> 回收站
                </button>
              </nav>

              {viewMode === 'active' && (
                <JobStatusList 
                  jobs={activeJobs} 
                  onSelectJob={(id) => { setViewMode('active'); setSelectedJobId(id); }} 
                  selectedJobId={selectedJobId}
                  onDelete={moveToTrash}
                />
              )}
            </div>
          </div>

          {/* Right Column: Viewport */}
          <div className="lg:col-span-7">
            {viewMode === 'active' ? (
              selectedJob ? (
                <ReportView job={selectedJob} />
              ) : (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-24 h-full flex flex-col items-center justify-center text-gray-300">
                  <div className="w-24 h-24 mb-6 opacity-10 border-4 border-dashed border-gray-900 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <p className="text-xl font-black italic tracking-tighter">WAITING FOR INSIGHT</p>
                  <p className="text-xs mt-3 font-bold text-gray-400 uppercase tracking-widest text-center">请在左侧工作台选择或配置任务</p>
                </div>
              )
            ) : (
              <TrashManager 
                jobs={trashJobs} 
                onRestore={restoreJob} 
                onPermanentDelete={permanentDelete} 
                onClearAll={clearTrash} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
