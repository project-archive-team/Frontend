import React, { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Briefcase,
  Code2,
  Check,
  Plus,
  Trash2,
  Bell,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  ExternalLink,
  Zap,
  Lock,
  Layers,
  FileText,
  Github
} from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';
import { initialAvatar } from '../services/avatar';

interface MyPageViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Python',
  'PostgreSQL',
  'Docker',
  'Tailwind CSS',
  'AWS',
  'GraphQL',
  'Spring Boot',
  'Kubernetes'
];

export const MyPageView: React.FC<MyPageViewProps> = ({ user, onUpdateUser }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'connected' | 'settings'>('profile');

  // Form states initialized with user props or defaults
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [bio, setBio] = useState(user.bio || '');

  // Social Avatars State
  const [provider, setProvider] = useState<'google' | 'github' | 'email'>(user.provider || 'email');
  // 아바타를 보관하는 곳이 없다 — 이름 첫 글자로 만든 이미지를 쓴다(외부 요청 없음).
  const googleAvatar = user.googleAvatar || initialAvatar(user.name);
  const githubAvatar = user.githubAvatar || initialAvatar(user.name);
  const [currentAvatar, setCurrentAvatar] = useState<string>(user.avatar || initialAvatar(user.name));

  const [techStack, setTechStack] = useState<string[]>(user.techStack || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  
  // Theme & Notifications
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user.theme || 'light');
  const [notifications, setNotifications] = useState(
    user.notifications || {
      emailAlerts: true,
      commitSyncAlerts: true,
      weeklyAiReport: true,
      marketing: false
    }
  );

  // Connected Services
  // 실제 연동 여부는 App이 /api/integrations로 읽어 넘겨준다. 모르는 동안은 미연결로 둔다.
  const [connectedServices, setConnectedServices] = useState(
    user.connectedServices || { github: false, googleDrive: false, notion: false }
  );

  useEffect(() => {
    if (user.connectedServices) setConnectedServices(user.connectedServices);
  }, [user.connectedServices]);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSelectAvatarProvider = (selectedProvider: 'google' | 'github') => {
    const newAvatar = selectedProvider === 'google' ? googleAvatar : githubAvatar;
    setProvider(selectedProvider);
    setCurrentAvatar(newAvatar);

    const updatedUser: User = {
      ...user,
      name,
      email,
      jobTitle,
      bio,
      techStack,
      theme,
      connectedServices,
      notifications,
      provider: selectedProvider,
      avatar: newAvatar,
      googleAvatar,
      githubAvatar,
    };
    onUpdateUser(updatedUser);
    showToast(
      selectedProvider === 'google'
        ? 'Google 계정 프로필 사진으로 변경되었습니다!'
        : 'GitHub 계정 프로필 사진으로 변경되었습니다!'
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name,
      email,
      jobTitle,
      bio,
      techStack,
      theme,
      connectedServices,
      notifications,
      provider,
      avatar: currentAvatar,
      googleAvatar,
      githubAvatar
    };
    onUpdateUser(updatedUser);
    showToast('프로필 및 설정 정보가 성공적으로 저장되었습니다!');
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechStack(techStack.filter((s) => s !== skillToRemove));
  };

  /**
   * 연결은 OAuth 화면으로 넘어가야 하고(토큰은 백엔드가 받는다), 해제는 저장된 토큰을 지우면 된다.
   * Notion은 OAuth가 아니라 토큰 붙여넣기라 소스 연결 화면으로 안내한다.
   */
  const toggleService = async (service: 'github' | 'googleDrive' | 'notion') => {
    const isConnecting = !connectedServices[service];
    const providerName = service === 'googleDrive' ? 'google' : service;

    if (isConnecting) {
      if (service === 'notion') {
        showToast('Notion은 소스 연결 화면에서 Integration 토큰을 등록해 주세요.');
        return;
      }
      // 돌아오면 App이 토큰을 저장하고 연동 상태를 다시 읽는다.
      apiService.auth.linkProvider(providerName as 'github' | 'google');
      return;
    }

    try {
      await apiService.integrations.disconnect(providerName as 'github' | 'google' | 'notion');
      const newState = { ...connectedServices, [service]: false };
      setConnectedServices(newState);
      onUpdateUser({ ...user, connectedServices: newState });
      showToast(`${service.toUpperCase()} 연결이 해제되었습니다.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '연결 해제에 실패했습니다.');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const updatedUser: User = {
      ...user,
      name,
      email,
      jobTitle,
      bio,
      techStack,
      theme: newTheme,
      connectedServices,
      notifications,
      provider,
      avatar: currentAvatar,
      googleAvatar,
      githubAvatar,
    };
    onUpdateUser(updatedUser);
    showToast(
      newTheme === 'dark'
        ? '다크 모드로 테마가 설정되었습니다.'
        : newTheme === 'light'
        ? '라이트 모드로 테마가 설정되었습니다.'
        : '시스템 기본 설정 모드로 변경되었습니다.'
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn break-keep">
      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold whitespace-nowrap">{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold mb-2 whitespace-nowrap">
              <UserIcon className="w-3.5 h-3.5 text-slate-700" />
              마이페이지 및 개인 설정
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-keep">
              계정 및 환경 설정 (My Page)
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mt-1 break-keep">
              프로필 정보, 외부 서비스 연동 상태, 구독 플랜 및 앱 환경 설정을 통합적으로 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 shrink-0">
            <div className="relative">
              <img
                src={currentAvatar}
                alt={name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-900/20"
              />
              <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[9px] font-extrabold shadow-xs ${
                provider === 'google' ? 'bg-blue-600' : provider === 'github' ? 'bg-slate-900' : 'bg-slate-600'
              }`}>
                {provider === 'google' ? 'G' : provider === 'github' ? 'GH' : 'U'}
              </div>
            </div>
            <div>
              <span className="block text-xs font-extrabold text-slate-900 whitespace-nowrap">{name}</span>
              <span className="text-[11px] text-slate-700 font-bold whitespace-nowrap">{jobTitle}</span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSection === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">프로필 관리</span>
          </button>

          <button
            onClick={() => setActiveSection('connected')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSection === 'connected'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="whitespace-nowrap">연동 계정 관리</span>
          </button>

          <button
            onClick={() => setActiveSection('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSection === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="whitespace-nowrap">테마 및 알림 설정</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 프로필 관리 */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-slate-900" />
                <span>기본 프로필 및 대표 기술 스택</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI 포트폴리오 및 자소서 자동 작성 시 기준이 되는 기본 인적 사항과 직무 기술을 설정합니다.
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>변경사항 저장</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar & Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">성명 (이름)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">이메일 계정</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="dev@company.com"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">직무 / 주요 역할</label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="풀스택 개발자">풀스택 개발자 (Full-Stack Engineer)</option>
                  <option value="프론트엔드 개발자">프론트엔드 개발자 (Frontend Engineer)</option>
                  <option value="백엔드 개발자">백엔드 개발자 (Backend Engineer)</option>
                  <option value="AI / 머신러닝 엔지니어">AI / 머신러닝 엔지니어 (AI/ML Engineer)</option>
                  <option value="DevOps / SRE 엔지니어">DevOps / SRE 엔지니어</option>
                  <option value="데이터 엔지니어">데이터 엔지니어 (Data Engineer)</option>
                  <option value="테크 리드 / 아키텍트">테크 리드 / 시스템 아키텍트</option>
                </select>
              </div>
            </div>

            {/* Bio & Intro */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">한 줄 개발자 소개 (Bio)</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="자기소개 및 아키텍처 강점을 작성하세요."
                />
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  <strong>AI 포트폴리오 팁:</strong> 설정하신 직무와 기술 스택은 Gemini AI가 아키텍처 요약 및 자소서 맞춤 답변 생성 시 중심 키워드로 자동 결합됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Management */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">주요 기술 스택 설정 (Tech Stack)</label>
              <p className="text-xs text-slate-500 mb-3">
                프로젝트 아카이브 분석 시 보유 기술과 대조할 핵심 스택 태그를 등록하세요.
              </p>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(tech)}
                      className="hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tech Stack Input */}
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  placeholder="예: Kafka, Redis, Vue.js..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillInput)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>스택 추가</span>
                </button>
              </div>

              {/* Popular Skill Quick Suggestion Badges */}
              <div className="mt-3">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">빠른 추천 스택 선택:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.filter((s) => !techStack.includes(s)).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social Profile Picture Sync Selector */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  계정 프로필 사진 연동 (Google & GitHub)
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Google 계정 또는 GitHub 연동 시 해당 소셜 계정의 프로필 사진이 자동으로 표시됩니다.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                현재 적용: {provider === 'google' ? 'Google 계정 사진' : provider === 'github' ? 'GitHub 계정 사진' : '일반 프로필 사진'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Profile Card */}
              <div
                onClick={() => handleSelectAvatarProvider('google')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  provider === 'google'
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={googleAvatar}
                      alt="Google Profile"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-xs"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs border border-slate-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-slate-900 leading-tight">Google 계정 사진</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate block">yongbin.gachon@gmail.com</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    provider === 'google'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 group-hover:bg-slate-100'
                  }`}
                >
                  {provider === 'google' ? '적용됨 ✓' : '선택'}
                </button>
              </div>

              {/* GitHub Profile Card */}
              <div
                onClick={() => handleSelectAvatarProvider('github')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  provider === 'github'
                    ? 'bg-slate-900 text-white border-slate-800 ring-2 ring-slate-900/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={githubAvatar}
                      alt="GitHub Profile"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30 shadow-xs"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full shadow-xs border border-slate-700 text-white">
                      <Github className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-xs font-extrabold leading-tight ${provider === 'github' ? 'text-white' : 'text-slate-900'}`}>
                      GitHub 계정 사진
                    </span>
                    <span className={`text-[10px] font-medium truncate block ${provider === 'github' ? 'text-slate-300' : 'text-slate-500'}`}>
                      dev-github@users.noreply.github.com
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    provider === 'github'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 group-hover:bg-slate-100'
                  }`}
                >
                  {provider === 'github' ? '적용됨 ✓' : '선택'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 2: 연동 계정 관리 */}
      {activeSection === 'connected' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>외부 플랫폼 연동 계정 관리</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                GitHub, Google Drive, Notion 서비스의 OAuth 권한 연결 상태를 확인하거나 해제합니다.
              </p>
            </div>
            <button
              onClick={() => showToast('모든 연동 계정의 최신 커밋 및 문서 동기화가 완료되었습니다.')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>전체 재동기화</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* GitHub Account Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connectedServices.github
                ? 'bg-slate-50/80 border-slate-300'
                : 'bg-white border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 text-white">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">GitHub</h3>
                    <span className="text-[10px] text-slate-500 block">커밋 & PR 연동</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  connectedServices.github ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {connectedServices.github ? '연결됨' : '미연결'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                개발 레포지토리의 커밋 내역과 Pull Request 변경사항을 실시간 수집합니다.
              </p>
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">마지막 동기화: 방금 전</span>
                <button
                  onClick={() => toggleService('github')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    connectedServices.github
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {connectedServices.github ? '연결 해제' : '계정 연결'}
                </button>
              </div>
            </div>

            {/* Google Drive Account Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connectedServices.googleDrive
                ? 'bg-slate-50/80 border-slate-300'
                : 'bg-white border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Google Drive</h3>
                    <span className="text-[10px] text-slate-500 block">문서 & 발표자료</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  connectedServices.googleDrive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {connectedServices.googleDrive ? '연결됨' : '미연결'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Google Docs, Slides 발표자료, PDF 아키텍처 문서를 분석 파이프라인으로 가져옵니다.
              </p>
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">마지막 동기화: 10분 전</span>
                <button
                  onClick={() => toggleService('googleDrive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    connectedServices.googleDrive
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {connectedServices.googleDrive ? '연결 해제' : '계정 연결'}
                </button>
              </div>
            </div>

            {/* Notion Account Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              connectedServices.notion
                ? 'bg-slate-50/80 border-slate-300'
                : 'bg-white border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Notion</h3>
                    <span className="text-[10px] text-slate-500 block">회의록 & 워크스페이스</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  connectedServices.notion ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {connectedServices.notion ? '연결됨' : '미연결'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                노션 데이터베이스의 회의록 및 기획서 페이지를 자동 수집 및 포트폴리오로 요약합니다.
              </p>
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">마지막 동기화: 1시간 전</span>
                <button
                  onClick={() => toggleService('notion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    connectedServices.notion
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {connectedServices.notion ? '연결 해제' : '계정 연결'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: 테마 및 알림 설정 */}
      {activeSection === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-8 transition-colors">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>화면 디스플레이 테마 설정</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                앱의 기본 색상 모드를 선택합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                  theme === 'light'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">라이트 모드</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">밝은 고대비 테마</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    다크 모드
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    눈이 편안한 어두운 테마
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                  theme === 'system'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${theme === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">시스템 동기화</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">OS 설정 자동 추종</span>
                </div>
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>알림 및 수신 설정 (Notifications)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                프로젝트 수집, AI 포트폴리오 리포트 발송 주기를 설정합니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="block text-xs font-bold text-slate-900 whitespace-nowrap">GitHub 커밋 및 소스 실시간 동기화 알림</span>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">외부 레포지토리에 새 커밋이 감지되면 알림을 받습니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.commitSyncAlerts}
                  onChange={(e) => {
                    setNotifications({ ...notifications, commitSyncAlerts: e.target.checked });
                    showToast('알림 설정이 변경되었습니다.');
                  }}
                  className="w-5 h-5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="block text-xs font-bold text-slate-900 whitespace-nowrap">주간 AI 요약 리포트 이메일 발송</span>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">매주 월요일 아침 한 주간의 아카이빙된 트러블슈팅 요약본을 이메일로 받습니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyAiReport}
                  onChange={(e) => {
                    setNotifications({ ...notifications, weeklyAiReport: e.target.checked });
                    showToast('알림 설정이 변경되었습니다.');
                  }}
                  className="w-5 h-5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="block text-xs font-bold text-slate-900 whitespace-nowrap">AI 포트폴리오 및 자소서 생성 완료 알림</span>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">대용량 AI 구조화 작업 완료 시 푸시 알림을 받습니다.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => {
                    setNotifications({ ...notifications, emailAlerts: e.target.checked });
                    showToast('알림 설정이 변경되었습니다.');
                  }}
                  className="w-5 h-5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
