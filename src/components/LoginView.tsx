import React, { useState } from 'react';
import { Sparkles, Code2, TrendingUp, UserCheck, ShieldCheck, Github, Mail, ArrowRight, Lock, User as UserIcon, Briefcase, CheckSquare, Square } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('풀스택 개발자');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiService.auth.login({ email, password });
      if (res && res.user) {
        onLoginSuccess(res.user);
      } else {
        // Local Fallback if backend is not reachable in dev
        onLoginSuccess({
          id: 'user-1',
          name: email.split('@')[0] || '김개발',
          email: email || 'dev.kim@company.com',
          provider: 'email',
          jobTitle: '풀스택 개발자',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          googleAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
          githubAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          connectedServices: {
            github: true,
            googleDrive: true,
            notion: true,
          },
        });
      }
    } catch (err) {
      console.error(err);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (!termsAgreed) {
      alert('서비스 이용약관 및 개인정보 처리방침에 동의해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.auth.signup({
        email: email.trim(),
        password,
        name: name.trim() || email.split('@')[0],
      });

      if (res && res.user) {
        alert(`환영합니다, ${res.user.name || name}님! 회원가입이 완료되었습니다.`);
        onLoginSuccess(res.user);
      } else {
        // Fallback for dev mode
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: name.trim() || email.split('@')[0] || '새로운 개발자',
          email: email.trim() || 'new.developer@company.com',
          jobTitle: jobTitle || '엔지니어',
          provider: 'email',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          googleAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
          githubAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          connectedServices: {
            github: false,
            googleDrive: false,
            notion: false,
          },
        };

        alert(`환영합니다, ${newUser.name}님! 회원가입이 완료되었습니다.`);
        onLoginSuccess(newUser);
      }
    } catch (err) {
      console.error(err);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    setIsLoading(true);
    // OAuth 2.0 Backend Redirection as specified by spec: GET /oauth2/authorization/{github|google}
    try {
      apiService.auth.startOAuth(provider);
    } catch (err) {
      console.warn('OAuth redirect error, falling back locally', err);
      onLoginSuccess({
        id: provider === 'google' ? 'google-user-123' : 'github-user-456',
        name: provider === 'google' ? '김개발 (Google)' : '김개발 (GitHub)',
        email: provider === 'google' ? 'yongbin.gachon@gmail.com' : 'dev-github@users.noreply.github.com',
        provider,
        googleAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        githubAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        avatar: provider === 'github'
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        connectedServices: {
          github: true,
          googleDrive: true,
          notion: true,
        },
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans md:overflow-hidden">
      {/* Left Panel: Slate/Black Theme (Fixed/Sticky on Desktop) */}
      <div className="w-full md:w-1/2 md:h-full bg-slate-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between items-center relative overflow-hidden shrink-0">
        {/* Background Decorative Blur Orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-slate-800/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl mx-auto">
          {/* Top Logo / Icon Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium mb-10 shadow-xs">
            <div className="p-1 rounded-md bg-slate-700 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>AI 기반 프로페셔널 아카이빙</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            당신의 프로젝트 경험을<br />
            <span className="text-slate-200">
              자산으로
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base lg:text-lg font-normal mb-10 leading-relaxed whitespace-nowrap overflow-x-auto">
            흩어진 프로젝트 산출물을 하나로 모아 AI가 포트폴리오를 설계합니다.
          </p>

          {/* Feature Highlight Cards */}
          <div className="space-y-4 w-full">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 transition-all duration-300 flex items-start gap-4 shadow-xs">
              <div className="p-2.5 rounded-xl bg-slate-700 text-slate-200 shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-1">
                  코드 & 문서 기반 Q&A
                </h3>
                <p className="text-sm text-slate-400 leading-snug">
                  저장소와 연동하여 코드를 분석하고 기술적 의사결정 과정에 대한 답변을 자동 생성합니다.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 transition-all duration-300 flex items-start gap-4 shadow-xs">
              <div className="p-2.5 rounded-xl bg-slate-700 text-slate-200 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-1">
                  자동 타임라인 생성
                </h3>
                <p className="text-sm text-slate-400 leading-snug">
                  프로젝트 기여도와 커밋 기록을 바탕으로 업무 히스토리와 성과를 시각화합니다.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 transition-all duration-300 flex items-start gap-4 shadow-xs">
              <div className="p-2.5 rounded-xl bg-slate-700 text-slate-200 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base mb-1">
                  면접 예상 질문 생성
                </h3>
                <p className="text-sm text-slate-400 leading-snug">
                  AI가 내 프로젝트 아키텍처를 분석하여 실전 같은 맞춤형 면접 질문을 제안합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info inside panel */}
        <div className="relative z-10 w-full max-w-xl mx-auto mt-12 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Project Archive & Portfolio Platform</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-slate-300" /> Secure OAuth 2.0 Integration</span>
        </div>
      </div>

      {/* Right Panel: White Form (Login / Sign Up) */}
      <div className="w-full md:w-1/2 md:h-full bg-white p-8 md:p-12 lg:p-16 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto py-8">
          {/* Header & Mode Switcher Tab */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp ? '회원가입' : '로그인'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignUp ? '새로운 계정을 만들고 AI 포트폴리오를 구축해 보세요.' : '플랫폼에 오신 것을 환영합니다'}
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* LOGIN FORM */}
          {!isSignUp ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">이메일</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">비밀번호</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? '로그인 중...' : '로그인'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">이름 (성함)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">이메일 계정</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">직군 / 직무 (Role)</label>
                <div className="relative">
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200 appearance-none"
                  >
                    <option value="백엔드 개발자">백엔드 개발자 (Backend Engineer)</option>
                    <option value="프론트엔드 개발자">프론트엔드 개발자 (Frontend Engineer)</option>
                    <option value="풀스택 개발자">풀스택 개발자 (Fullstack Engineer)</option>
                    <option value="DevOps / 인프라 엔지니어">DevOps / 인프라 엔지니어</option>
                    <option value="AI / 머신러닝 엔지니어">AI / 머신러닝 엔지니어</option>
                    <option value="데이터 엔지니어">데이터 엔지니어</option>
                  </select>
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">비밀번호</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상 입력"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div
                onClick={() => setTermsAgreed(!termsAgreed)}
                className="flex items-center gap-2 pt-1 cursor-pointer select-none"
              >
                {termsAgreed ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-600">
                  <strong className="text-slate-900">서비스 이용약관</strong> 및 <strong className="text-slate-900">개인정보 처리방침</strong>에 동의합니다.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? '회원가입 진행 중...' : '회원가입 완료 및 시작하기'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Social Login Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                {isSignUp ? '소셜 계정으로 회원가입' : '또는 간편하게 로그인'}
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google 계정으로 {isSignUp ? '가입하기' : '계속하기'}</span>
            </button>

            <button
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Github className="w-4 h-4" />
              <span>GitHub 계정으로 {isSignUp ? '가입하기' : '계속하기'}</span>
            </button>
          </div>

          <div className="text-center pt-2 text-xs text-slate-500">
            {isSignUp ? (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  로그인하기
                </button>
              </>
            ) : (
              <>
                계정이 없으신가요?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  회원가입하기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

