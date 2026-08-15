import React, { useState } from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  Link2,
  BookOpenCheck,
  Briefcase,
  ChevronDown,
  LogOut,
  Plus,
  Menu,
  X,
  ChevronRight,
  UserCog,
  Sun,
  Moon
} from 'lucide-react';
import { User, Project } from '../types';
import { initialAvatar } from '../services/avatar';

export type NavTab = 'dashboard' | 'connectors' | 'archive' | 'career' | 'mypage';

interface NavbarProps {
  user: User;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onOpenNewProjectModal: () => void;
  onLogout: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  onOpenNewProjectModal,
  onLogout,
  onUpdateUser,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleToggleTheme = () => {
    if (!onUpdateUser) return;
    const nextTheme = user.theme === 'dark' ? 'light' : 'dark';
    onUpdateUser({
      ...user,
      theme: nextTheme,
    });
  };

  const isDarkMode = user.theme === 'dark';

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs transition-colors">
        <div
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <FolderKanban className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight whitespace-nowrap break-keep">
            devlog
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onUpdateUser && (
            <button
              onClick={handleToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm whitespace-nowrap">메뉴 탐색</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Project Selector Mobile */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block whitespace-nowrap">현재 선택된 프로젝트</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2 bg-white text-slate-900 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  onOpenNewProjectModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">새 프로젝트 생성</span>
              </button>
            </div>

            {/* Navigation Buttons Mobile */}
            <nav className="space-y-1.5">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="break-keep">대시보드</span>
              </button>

              <button
                onClick={() => handleNavClick('connectors')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'connectors'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span className="break-keep">소스 연결 & 파일 수집</span>
              </button>

              <button
                onClick={() => handleNavClick('archive')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'archive'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpenCheck className="w-4 h-4" />
                <span className="break-keep">아카이브 & AI 포트폴리오</span>
              </button>

              <button
                onClick={() => handleNavClick('career')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'career'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="break-keep">취업 지원 도구 (자소서·면접)</span>
              </button>

              <button
                onClick={() => handleNavClick('mypage')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'mypage'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span className="break-keep">마이페이지 (계정 & 설정)</span>
              </button>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar || initialAvatar(user.name)}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{user.name}</span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{user.email}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 h-screen sticky top-0 shrink-0 p-5 z-30 shadow-xs overflow-y-auto transition-colors">
        <div className="space-y-6">
          
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs group-hover:bg-slate-800 dark:group-hover:bg-slate-200 transition-colors shrink-0">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight flex items-center gap-1.5 whitespace-nowrap break-keep">
                  devlog
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider shrink-0">
                    AI PRO
                  </span>
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5 whitespace-nowrap">
                  개발 기록에서 포트폴리오까지
                </span>
              </div>
            </div>

            {onUpdateUser && (
              <button
                onClick={handleToggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Selected Project Control Box */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                활성 프로젝트
              </span>
              <button
                onClick={onOpenNewProjectModal}
                className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                title="새 프로젝트 추가"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>생성</span>
              </button>
            </div>

            {projects.length > 0 && (
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs truncate"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Main Navigation Items */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap">
              메인 메뉴
            </span>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 group ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap break-keep">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span className="break-keep whitespace-nowrap">대시보드</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'dashboard' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            </button>

            <button
              onClick={() => setActiveTab('connectors')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 group ${
                activeTab === 'connectors'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap break-keep">
                <Link2 className="w-4 h-4 shrink-0" />
                <span className="break-keep whitespace-nowrap">소스 연결 & 파일 수집</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'connectors' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 group ${
                activeTab === 'archive'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap break-keep">
                <BookOpenCheck className="w-4 h-4 shrink-0" />
                <span className="break-keep whitespace-nowrap">아카이브 & AI 포트폴리오</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${activeTab === 'archive' ? 'bg-white dark:bg-slate-900' : 'bg-slate-400'} animate-pulse`} />
            </button>

            <button
              onClick={() => setActiveTab('career')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 group ${
                activeTab === 'career'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap break-keep">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="break-keep whitespace-nowrap">취업 지원 도구</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'career' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            </button>

            <button
              onClick={() => setActiveTab('mypage')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 group ${
                activeTab === 'mypage'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 whitespace-nowrap break-keep">
                <UserCog className="w-4 h-4 shrink-0" />
                <span className="break-keep whitespace-nowrap">마이페이지 & 설정</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === 'mypage' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            </button>
          </div>
        </div>

        {/* User Profile Card at Bottom of Sidebar */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
          <div
            onClick={() => setActiveTab('mypage')}
            className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
            title="마이페이지로 이동"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatar || initialAvatar(user.name)}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 group-hover:ring-slate-400 dark:group-hover:ring-slate-500 transition-all"
              />
              <div className="min-w-0">
                <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate whitespace-nowrap">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block whitespace-nowrap">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-center text-slate-400 font-medium whitespace-nowrap">
            Gemini 3.6 Flash Engine Connected
          </div>
        </div>
      </aside>
    </>
  );
};

