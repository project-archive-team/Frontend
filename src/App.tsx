import React, { useState, useEffect } from 'react';
import { User, Project, ProjectArtifact, TimelineEvent, PortfolioData, InterviewPrepItem, CoverLetterQA } from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_ARTIFACTS,
  INITIAL_TIMELINES,
  INITIAL_PORTFOLIO_PROJ_1,
  INITIAL_INTERVIEW_ITEMS,
  INITIAL_COVER_LETTERS,
} from './data/initialData';
import { LoginView } from './components/LoginView';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SourceConnectorView } from './components/SourceConnectorView';
import { PortfolioArchiveView } from './components/PortfolioArchiveView';
import { CareerToolsView } from './components/CareerToolsView';
import { MyPageView } from './components/MyPageView';
import { FloatingChatbot } from './components/FloatingChatbot';
import { NewProjectModal } from './components/NewProjectModal';
import { apiService, tokenStorage } from './services/api';

export default function App() {
  // State 1: User Auth Session
  const [user, setUser] = useState<User | null>({
    id: 'user-default',
    name: '김개발',
    email: 'dev.kim@company.com',
    provider: 'github',
    googleAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    githubAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    jobTitle: '풀스택 개발자',
    bio: '아키텍처 수집과 트러블슈팅 아카이빙을 즐기는 3년차 엔지니어입니다.',
    techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
    theme: 'light',
    connectedServices: {
      github: true,
      googleDrive: true,
      notion: true,
    },
    connectedServicesLastSynced: {
      github: '방금 전',
      googleDrive: '10분 전',
      notion: '1시간 전'
    },
    notifications: {
      emailAlerts: true,
      commitSyncAlerts: true,
      weeklyAiReport: true,
      marketing: false
    }
  });

  // 1. OAuth Redirect Token Extraction & Auto User Fetch (/api/auth/me)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');

    if (accessToken) {
      tokenStorage.setTokens(accessToken, refreshToken || undefined);
      // Clear URL params for clean address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (tokenStorage.getAccessToken()) {
      apiService.auth.me().then((meData) => {
        if (meData) {
          setUser((prev) => ({
            ...prev,
            ...meData,
            id: meData.id || prev?.id || 'user-1',
            email: meData.email || prev?.email || '',
            name: meData.name || prev?.name || '개발자',
          }));
        }
      });
    }
  }, []);

  // State 2: Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // State 3: Projects & Selected Project
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);

  // State 4: Artifacts & Timelines
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>(INITIAL_ARTIFACTS);
  const [timelines, setTimelines] = useState<TimelineEvent[]>(INITIAL_TIMELINES);

  // State 5: AI Portfolio Data Cache per project
  const [portfolios, setPortfolios] = useState<Record<string, PortfolioData>>({
    'proj-1': INITIAL_PORTFOLIO_PROJ_1,
  });

  // State 6: Career Support Data (Cover Letters & Interview Preps)
  const [coverLetters, setCoverLetters] = useState<CoverLetterQA[]>(INITIAL_COVER_LETTERS);
  const [interviewItems, setInterviewItems] = useState<InterviewPrepItem[]>(INITIAL_INTERVIEW_ITEMS);

  // Loading States
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);

  // Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Dark Mode Synchronizer Effect
  useEffect(() => {
    const theme = user?.theme || 'light';
    const root = document.documentElement;

    if (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user?.theme]);

  // Handlers
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  const handleCreateProject = async (
    newProjData: Omit<
      Project,
      'id' | 'createdAt' | 'lastUpdated' | 'filesCount' | 'commitsCount' | 'progress'
    >
  ) => {
    const newId = `proj-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Try creating via Spring API POST /api/projects
    const apiRes = await apiService.projects.create({
      title: newProjData.title,
      description: newProjData.description,
      role: newProjData.role,
      period: newProjData.period,
      teamSize: typeof newProjData.teamSize === 'number' ? newProjData.teamSize : parseInt(String(newProjData.teamSize || 1), 10),
      techStack: newProjData.techStack,
      githubRepo: newProjData.githubRepo,
      notionUrl: newProjData.notionUrl,
    });

    const createdProject: Project = {
      ...newProjData,
      id: apiRes?.id || newId,
      createdAt: todayStr,
      lastUpdated: todayStr,
      filesCount: 1,
      commitsCount: 3,
      progress: 25,
      summaryQuote: `${newProjData.title} 프로젝트 수집이 새롭게 시작되었습니다.`,
    };

    // Add initial placeholder artifact for this project
    const newArtifact: ProjectArtifact = {
      id: `art-${Date.now()}`,
      projectId: createdProject.id,
      title: `${newProjData.title} 초기 스펙 및 요구사항`,
      type: 'document',
      content: `[프로젝트명]: ${newProjData.title}\n[역할]: ${newProjData.role}\n[설명]: ${newProjData.description}\n[기술스택]: ${newProjData.techStack.join(', ')}`,
      author: user?.name || '김개발',
      timestamp: `${todayStr} 10:00`,
      tags: ['Initial Spec', 'Setup'],
    };

    setProjects((prev) => [createdProject, ...prev]);
    setArtifacts((prev) => [newArtifact, ...prev]);
    setSelectedProjectId(createdProject.id);
    setActiveTab('connectors');
  };

  const handleDeleteProject = async (projId: string) => {
    if (confirm('정말로 이 프로젝트를 아카이브에서 삭제하시겠습니까?')) {
      await apiService.projects.delete(projId);
      const nextProjects = projects.filter((p) => p.id !== projId);
      setProjects(nextProjects);
      if (selectedProjectId === projId && nextProjects.length > 0) {
        setSelectedProjectId(nextProjects[0].id);
      }
    }
  };

  const handleAddArtifact = (newArt: Omit<ProjectArtifact, 'id' | 'timestamp'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const created: ProjectArtifact = {
      ...newArt,
      id: `art-${Date.now()}`,
      timestamp: `${todayStr} 12:00`,
    };

    setArtifacts((prev) => [created, ...prev]);

    // Update project files count
    setProjects((prev) =>
      prev.map((p) =>
        p.id === newArt.projectId
          ? { ...p, filesCount: p.filesCount + 1, lastUpdated: todayStr }
          : p
      )
    );
  };

  const handleDeleteArtifact = (artId: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== artId));
  };

  // Spring Boot Backend Portfolio Structure Generator Handler
  const handleRegeneratePortfolio = async (projId: string) => {
    const targetProject = projects.find((p) => p.id === projId);
    if (!targetProject) return;

    setIsGeneratingPortfolio(true);

    const targetArtifacts = artifacts.filter((a) => a.projectId === projId);
    const artifactsText = targetArtifacts
      .map((a) => `[유형: ${a.type}] 제목: ${a.title}\n내용:\n${a.content}`)
      .join('\n\n---\n\n');

    try {
      // Call Spring Boot Backend API (POST /api/projects/{id}/interview)
      const res = await apiService.projects.generateInterviewOrCoverLetter(projId, {
        type: 'portfolio',
      });

      if (res && res.portfolio) {
        setPortfolios((prev) => ({
          ...prev,
          [projId]: {
            ...res.portfolio,
            projectId: projId,
            updatedAt: new Date().toLocaleString('ko-KR'),
          },
        }));
      } else {
        // Spring Backend Fallback response
        const basePortfolio = portfolios[projId] || INITIAL_PORTFOLIO_PROJ_1;
        const fullPortfolioData: PortfolioData = {
          ...basePortfolio,
          projectId: projId,
          updatedAt: new Date().toLocaleString('ko-KR'),
          executiveSummary: {
            oneLineSummary: `${targetProject.title} - ${targetProject.description}`,
            servicePurpose: `${targetProject.title} 서비스의 아키텍처 수집 및 기술 산출물 구조화`,
            targetAudience: '내부 개발팀 및 기술 채용 면접관',
            period: targetProject.period,
            teamSize: `${targetProject.teamSize}명`,
            myPosition: targetProject.role,
          },
          techStackAndArchitecture: {
            techList: targetProject.techStack.map((tech) => ({
              techName: tech,
              category: 'Core Stack',
              reasonForAdoption: `${tech} 도입을 통한 모듈성 강화 및 성능 최적화`,
            })),
            systemArchitectureDesc: `${targetProject.title} 시스템은 클라이언트와 Spring 백엔드 간 REST API 데이터 파이프라인 구조로 설계되었습니다.`,
            erdSummary: '독립 모듈화 및 데이터 정규화를 통한 유지보수성 확보',
          },
          keyContributions: basePortfolio.keyContributions || [
            {
              id: `kc-${Date.now()}-1`,
              title: 'Spring Boot REST API 및 아키텍처 모듈화',
              description: `${targetProject.role}로서 Spring 백엔드 기반 데이터 흐름 단일화 진행`,
              impactMetrics: '생산성 35% 향상 및 유지보수 용이성 확보',
            },
          ],
          troubleshootingList: basePortfolio.troubleshootingList || [
            {
              id: `ts-${Date.now()}-1`,
              title: '대용량 데이터 처리 및 병목 현상 개선',
              situation: '산출물 데이터 증가 시 응답 지연 발생',
              action: 'Spring 비동기 처리 구조 도입 및 인덱싱 재구성',
              result: '처리 속도 50% 향상 및 안정적 응답 확보',
              tags: ['Performance', 'Optimization'],
            },
          ],
          retrospective: {
            technicalGrowth: 'Spring REST API 설계 능력 향상 및 기술 선택 근거 체계화',
            collaborationInsights: '문서화와 아카이빙을 통한 협업 효율 증대',
            futureImprovements: '자동화 테스트 커버리지 확대 및 모니터링 강화',
          },
        };

        setPortfolios((prev) => ({
          ...prev,
          [projId]: fullPortfolioData,
        }));
      }
    } catch (error) {
      console.error('Failed to generate portfolio:', error);
      alert('포트폴리오 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPortfolio(false);
    }
  };

  // Spring Boot Backend Cover Letter Answer Generator Handler
  const handleGenerateCoverLetter = async (
    question: string,
    jobRole: string,
    projId: string
  ) => {
    const targetProject = projects.find((p) => p.id === projId);
    if (!targetProject) return;

    setIsGeneratingCL(true);

    try {
      // Call Spring Boot Backend API (POST /api/projects/{id}/interview)
      const res = await apiService.projects.generateInterviewOrCoverLetter(projId, {
        type: 'cover_letter',
        question,
        jobRole,
      });

      if (res && res.coverLetter) {
        setCoverLetters((prev) => [res.coverLetter, ...prev]);
      } else {
        const generatedAnswer = `[지원 직무: ${jobRole}]
${question}에 대하여, 저는 '${targetProject.title}' 프로젝트 경험을 바탕으로 답변을 구성하였습니다.

프로젝트 수행 당시 ${targetProject.role} 역할을 담당하여 ${targetProject.techStack.join(', ')} 기술을 적극 활용하였습니다. 문제 해결 과정에서 명확한 원인 분석과 기술적 대안 검토를 진행하였으며, 정량적인 성과를 도출해낼 수 있었습니다.

이러한 경험은 ${jobRole} 직무에서 마주할 복잡한 기술적 이슈를 주도적으로 해결하고, 조직의 목표 달성에 기여하는 데 큰 자산이 될 것입니다.`;

        const newCL: CoverLetterQA = {
          id: `cl-${Date.now()}`,
          question,
          jobTarget: jobRole,
          selectedProjectId: projId,
          projectTitle: targetProject.title,
          generatedAnswer,
          starBreakdown: {
            situation: `${targetProject.title} 프로젝트 진행 과정에서 직면한 핵심 문제 상황`,
            task: `${targetProject.role}로서 해결해야 할 고난도 기술 목표`,
            action: `${targetProject.techStack.slice(0, 2).join(', ')} 중심의 기술 적용 및 문제 해결`,
            result: '성공적인 문제 해결 및 정량적 기술 성과 달성',
          },
          createdAt: new Date().toLocaleDateString(),
        };

        setCoverLetters((prev) => [newCL, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      alert('자소서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  // Spring Boot Backend Interview QA Generator Handler
  const handleGenerateInterviewQA = async (projId: string) => {
    const targetProject = projects.find((p) => p.id === projId);
    if (!targetProject) return;

    setIsGeneratingQA(true);

    try {
      // Call Spring Boot Backend API (POST /api/projects/{id}/interview)
      const res = await apiService.projects.generateInterviewOrCoverLetter(projId, {
        type: 'interview_qa',
      });

      if (res && Array.isArray(res.items)) {
        setInterviewItems(res.items);
      } else {
        const formattedItems: InterviewPrepItem[] = [
          {
            id: `int-${Date.now()}-1`,
            projectId: projId,
            category: '건축/아키텍처',
            question: `'${targetProject.title}' 프로젝트에서 ${targetProject.techStack[0] || '주요 기술'}을 선택한 구체적인 이유는 무엇인가요?`,
            sampleAnswer: `프로젝트의 확장성과 도메인 요구사항을 고려할 때, ${targetProject.techStack[0] || '해당 기술'}이 가장 높은 안정성과 모듈화 편의성을 제공한다고 판단하였습니다. Spring 백엔드 통신과 결합하여 개발 생산성 및 유지보수 편의성이 향상되었습니다.`,
            keyCheckingPoints: [
              '기술 선택 시 명확한 의사결정 기준 존재 여부',
              '트레이드오프 분석 경험 유무',
            ],
            followUpQuestions: [
              '다른 대안 기술과의 비교 시 장단점은 무엇이었나요?',
              '다시 구축한다면 개선하고 싶은 기술 구조가 있나요?',
            ],
          },
          {
            id: `int-${Date.now()}-2`,
            projectId: projId,
            category: '트러블슈팅',
            question: `프로젝트 수행 중 마주한 가장 기억에 남는 기술적 병목과 해결 과정은 무엇인가요?`,
            sampleAnswer: `데이터 처리 과정에서 병목 현상이 발생하여 원인을 파악한 후 비동기 파이프라인 및 구조 최적화를 단행했습니다. 그 결과 처리 응답 속도를 기존 대비 40% 이상 개선할 수 있었습니다.`,
            keyCheckingPoints: [
              '문제 원인 규명을 위한 논리적 접근 방식',
              '정량적 측정 및 개선 성과 제시',
            ],
            followUpQuestions: [
              '성능 개선 지표는 어떻게 측정하셨나요?',
              '개선 과정에서 부작용이나 이슈는 없었나요?',
            ],
          },
        ];

        setInterviewItems(formattedItems);
      }
    } catch (error) {
      console.error('Failed to generate interview QA:', error);
      alert('면접 예상 질문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingQA(false);
    }
  };

  // Render Login View if not authenticated
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const currentPortfolio = portfolios[selectedProjectId] || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased break-keep transition-colors duration-200">
      {/* Left Sidebar Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onLogout={handleLogout}
        onUpdateUser={(updatedUser) => setUser(updatedUser)}
      />

      {/* Main App Content View Switcher */}
      <div className="flex-1 min-w-0 flex flex-col justify-between min-h-screen">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              timelines={timelines}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              onNavigateToTab={setActiveTab}
              onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {activeTab === 'connectors' && (
            <SourceConnectorView
              projects={projects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              artifacts={artifacts}
              onAddArtifact={handleAddArtifact}
              onDeleteArtifact={handleDeleteArtifact}
            />
          )}

          {activeTab === 'archive' && (
            <PortfolioArchiveView
              projects={projects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              portfolio={currentPortfolio}
              onRegeneratePortfolio={handleRegeneratePortfolio}
              artifacts={artifacts}
              isGenerating={isGeneratingPortfolio}
            />
          )}

          {activeTab === 'career' && (
            <CareerToolsView
              projects={projects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              coverLetters={coverLetters}
              onGenerateCoverLetter={handleGenerateCoverLetter}
              interviewItems={interviewItems}
              onGenerateInterviewQA={handleGenerateInterviewQA}
              isGeneratingCL={isGeneratingCL}
              isGeneratingQA={isGeneratingQA}
            />
          )}

          {activeTab === 'mypage' && user && (
            <MyPageView
              user={user}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium mt-auto transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="whitespace-nowrap">© 2026 프로젝트 아카이빙 및 AI 포트폴리오 생성 플랫폼</span>
            <span className="whitespace-nowrap text-slate-400">Powered by Gemini 3.6 Flash & Server-Side @google/genai SDK</span>
          </div>
        </footer>
      </div>

      {/* Persistent Floating Q&A Streaming Chatbot */}
      <FloatingChatbot
        projects={projects}
        selectedProjectId={selectedProjectId}
        artifacts={artifacts}
      />

      {/* New Project Registration Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
