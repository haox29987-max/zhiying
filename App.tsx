import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnalysisJob, UserData, AllowedUser } from './types';
import Header from './components/Header';
import AnalysisForm from './components/AnalysisForm';
import JobStatusList from './components/JobStatusList';
import ReportView from './components/ReportView';
import LoginForm from './components/LoginForm';
import AdminPortal from './components/AdminPortal';
import TrashManager from './components/TrashManager';
import { LayoutDashboard, Trash2 } from 'lucide-react';

// 配置你的后端 API 地址。如果在其他电脑访问，请将 localhost 替换为你这台主机的内网 IP
const API_BASE = 'http://localhost:8000';

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

  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('cf_allowed_users', JSON.stringify(allowedUsers));
  }, [allowedUsers]);

  // 从后端获取当前用户的任务列表
  const fetchJobs = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/jobs?username=${encodeURIComponent(currentUser.username)}`);
      if (res.ok) {
        const data = await res.json();
        
        // 拼接完整的视频局域网地址
        const updatedJobs = data.jobs.map((job: any) => {
          if (job.video_rel_path && !job.video_rel_path.startsWith('http')) {
             job.video_rel_path = `${API_BASE}${job.video_rel_path}`;
          }
          return job;
        });
        
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs from server", err);
    }
  };

  // 轮询机制：如果用户在线且有任务处于处理状态，每3秒同步一次数据
  useEffect(() => {
    if (currentUser && jobs.some(j => j.status !== 'completed' && j.status !== 'failed')) {
      pollIntervalRef.current = window.setInterval(fetchJobs, 3000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentUser, jobs]);

  // 初始加载当前用户的任务
  useEffect(() => {
    if (currentUser && !isLoggedInAsAdmin) {
      fetchJobs();
    }
  }, [currentUser]);

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
    setJobs([]);
  };

  const handleLogin = async (user: UserData, mode: 'employee' | 'admin') => {
    try {
      // 登录时通知后端建立 D 盘专属文件夹
      await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, mode })
      });
      
      if (mode === 'admin') {
        setIsLoggedInAsAdmin(true);
      } else {
        setCurrentUser(user);
      }
    } catch (err) {
      alert("无法连接到内网服务器，请检查服务端是否运行！");
    }
  };

  const startAnalysis = async (inputs: { urls: string[], model: string }) => {
    if (!currentUser) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: inputs.urls,
          model: inputs.model,
          username: currentUser.username
        })
      });
      
      if (res.ok) {
        fetchJobs(); // 立即刷新任务列表，让其进入 pending/scraping 状态
      }
    } catch (error) {
      alert("提交任务失败，请检查内网连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  const moveToTrash = async (id: string) => {
    if (!currentUser) return;
    try {
      await fetch(`${API_BASE}/api/jobs/${id}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      fetchJobs(); // 刷新数据
      if (selectedJobId === id) setSelectedJobId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const restoreJob = (id: string) => {
    // 逻辑同上，需后端提供 /api/jobs/{id}/restore，此处为前端更新演示
    setJobs(prev => prev.map(j => j.id === id ? { ...j, deletedAt: undefined } : j));
  };

  const permanentDelete = (id: string) => {
    if (confirm('确定要永久粉碎此任务吗？此操作无法撤销，并将删除D盘对应的物理文件。')) {
      // 需通知后端物理删除文件夹
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
        onLogin={(user) => handleLogin(user, 'admin')} 
        onCancel={() => setIsAdminMode(false)} 
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginForm 
        mode="employee" 
        allowedUsers={allowedUsers}
        onLogin={(user) => handleLogin(user, 'employee')} 
        onLogoClick={handleLogoClick} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#fafafa]">
      <Header onLogoClick={handleLogoClick} user={currentUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-6 mt-12 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
