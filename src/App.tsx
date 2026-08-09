import React, { useCallback, useEffect, useState } from 'react';
import {
  User,
  Project,
  ProjectArtifact,
  TimelineEvent,
  PortfolioData,
  InterviewPrepItem,
  CoverLetterQA,
  SourceView,
} from './types';
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
import {
  toArtifact,
  toCoverLetter,
  toInterviewItem,
  toPortfolioData,
  toProject,
  toTimelineEvent,
} from './services/mappers';

/** 화면에 보여줄 만한 문구로 바꾼다. 원인은 콘솔에 남긴다. */
function describeError(err: unknown, fallback: string): string {
  console.error(err);
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [sources, setSources] = useState<SourceView[]>([]);

  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  const [timelines, setTimelines] = useState<TimelineEvent[]>([]);

  const [portfolios, setPortfolios] = useState<Record<string, PortfolioData>>({});
  const [coverLetters, setCoverLetters] = useState<CoverLetterQA[]>([]);
  const [interviewItems, setInterviewItems] = useState<InterviewPrepItem[]>([]);

  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // 1. OAuth 리다이렉트로 돌아온 토큰을 거둬들이고, 저장된 토큰이 있으면 세션을 복구한다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    if (accessToken) {
      tokenStorage.setTokens(accessToken, params.get('refreshToken') || undefined);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 연동하려고 OAuth로 떠났던 화면으로 되돌려준다.
    const returnTab = sessionStorage.getItem('return_tab');
    if (returnTab) {
      sessionStorage.removeItem('return_tab');
      setActiveTab(returnTab as NavTab);
    }

    if (!tokenStorage.getAccessToken()) {
      setIsBootstrapping(false);
      return;
    }

    (async () => {
      try {
        const me = await apiService.auth.me();
        setUser({
          ...me,
          techStack: me.techStack ?? [],
          theme: (me.theme as User['theme']) ?? 'light',
          provider: accessToken ? 'github' : 'email',
        });
      } catch {
        // 토큰이 만료·폐기됐으면 로그인 화면으로 돌린다.
        tokenStorage.clearTokens();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  // 2. 연동 상태는 백엔드가 실제로 토큰을 들고 있는지로 판단한다.
  const refreshIntegrations = useCallback(async () => {
    try {
      const status = await apiService.integrations.status();
      setUser((prev) =>
        prev
          ? {
              ...prev,
              connectedServices: {
                github: status.github,
                googleDrive: status.google,
                notion: status.notion,
              },
            }
          : prev
      );
    } catch (err) {
      console.warn('연동 상태 조회 실패', err);
    }
  }, []);

  // 3. 프로젝트 목록.
  const reloadProjects = useCallback(async (preferId?: string) => {
    const list = await apiService.projects.list();
    const mapped = list.map((p) => toProject(p));
    setProjects(mapped);
    setSelectedProjectId((current) => {
      const wanted = preferId ?? current;
      return mapped.some((p) => p.id === wanted) ? wanted : mapped[0]?.id ?? '';
    });
    return mapped;
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshIntegrations();
    reloadProjects().catch((err) => console.error('프로젝트 목록을 불러오지 못했습니다', err));
  }, [user?.id, refreshIntegrations, reloadProjects]);

  // 4. 선택된 프로젝트의 소스·산출물·타임라인.
  const reloadProjectData = useCallback(
    async (projectId: string) => {
      if (!projectId) {
        setSources([]);
        setArtifacts([]);
        setTimelines([]);
        return;
      }
      const numericId = Number(projectId);
      const title = projects.find((p) => p.id === projectId)?.title ?? '';
      try {
        const [detail, artifactList, timelineList, saved] = await Promise.all([
          apiService.projects.detail(numericId),
          apiService.projects.artifacts(numericId),
          apiService.projects.timeline(numericId),
          // 저장해 둔 포트폴리오를 되살린다 — 없으면 undefined.
          apiService.projects.savedPortfolio(numericId).catch(() => undefined),
        ]);
        if (saved) {
          setPortfolios((prev) => ({ ...prev, [projectId]: toPortfolioData(saved, projectId) }));
        }
        setSources(detail.sources);
        // 소스에 등록된 저장소 주소를 카드에도 반영한다.
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? toProject(detail.project, detail.sources) : p))
        );
        setArtifacts(artifactList.map((a) => toArtifact(a, projectId)));
        setTimelines(timelineList.map((t) => toTimelineEvent(t, projectId, title)));
      } catch (err) {
        console.error('프로젝트 상세를 불러오지 못했습니다', err);
      }
    },
    [projects]
  );

  useEffect(() => {
    reloadProjectData(selectedProjectId);
    // projects가 바뀔 때마다 다시 부르면 무한 루프가 된다 — 선택된 프로젝트에만 반응한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // 테마는 서버에 저장된 값을 따른다.
  useEffect(() => {
    const theme = user?.theme || 'light';
    const root = document.documentElement;
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
  }, [user?.theme]);

  // ── 핸들러 ────────────────────────────────────────────────────────────────

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    tokenStorage.clearTokens();
    setUser(null);
    setProjects([]);
    setArtifacts([]);
    setTimelines([]);
    setPortfolios({});
  };

  const handleUpdateUser = async (updated: User) => {
    setUser(updated);
    try {
      await apiService.auth.updateMe({
        name: updated.name,
        jobTitle: updated.jobTitle,
        bio: updated.bio,
        theme: updated.theme,
        techStack: updated.techStack,
      });
    } catch (err) {
      alert(describeError(err, '프로필 저장에 실패했습니다.'));
    }
  };

  /**
   * 프로젝트를 만들고, 모달에서 받은 저장소 주소를 그대로 수집 소스로 등록한다.
   * 소스가 있어야 동기화가 돌기 때문에 생성과 한 흐름으로 묶는다.
   */
  const handleCreateProject = async (
    newProjData: Omit<
      Project,
      'id' | 'createdAt' | 'lastUpdated' | 'filesCount' | 'commitsCount' | 'progress'
    >
  ) => {
    try {
      const created = await apiService.projects.create({
        name: newProjData.title,
        period: newProjData.period,
        members: parseInt(String(newProjData.teamSize).replace(/\D/g, ''), 10) || 1,
        techStack: newProjData.techStack,
        description: newProjData.description,
        role: newProjData.role,
        category: newProjData.category,
        state: newProjData.status === '완료' ? 'COMPLETED' : 'ONGOING',
      });

      const wanted: { type: 'GITHUB' | 'GDRIVE' | 'NOTION'; ref?: string }[] = [
        { type: 'GITHUB', ref: newProjData.githubRepo },
        { type: 'GDRIVE', ref: newProjData.googleDriveUrl },
        { type: 'NOTION', ref: newProjData.notionUrl },
      ];
      for (const s of wanted) {
        if (s.ref && s.ref.trim()) {
          await apiService.projects.addSource(created.id, { type: s.type, externalRef: s.ref.trim() });
        }
      }

      await reloadProjects(String(created.id));
      setActiveTab('connectors');
    } catch (err) {
      alert(describeError(err, '프로젝트 생성에 실패했습니다.'));
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm('정말로 이 프로젝트를 아카이브에서 삭제하시겠습니까?')) return;
    try {
      await apiService.projects.remove(Number(projId));
      setPortfolios((prev) => {
        const next = { ...prev };
        delete next[projId];
        return next;
      });
      await reloadProjects();
    } catch (err) {
      alert(describeError(err, '프로젝트 삭제에 실패했습니다.'));
    }
  };

  const handleAddArtifact = async (newArt: Omit<ProjectArtifact, 'id' | 'timestamp'>) => {
    const backendType =
      newArt.type === 'code' ? 'CODE' : newArt.type === 'meeting_note' ? 'MEETING' : 'DOC';
    try {
      await apiService.projects.addArtifact(Number(newArt.projectId), {
        type: backendType,
        title: newArt.title,
        content: newArt.content,
        tags: newArt.tags,
      });
      await reloadProjectData(newArt.projectId);
      await reloadProjects(newArt.projectId);
    } catch (err) {
      alert(describeError(err, '산출물 등록에 실패했습니다.'));
    }
  };

  const handleDeleteArtifact = async (artId: string) => {
    try {
      await apiService.projects.removeArtifact(Number(selectedProjectId), Number(artId));
      await reloadProjectData(selectedProjectId);
      await reloadProjects(selectedProjectId);
    } catch (err) {
      alert(describeError(err, '산출물 삭제에 실패했습니다.'));
    }
  };

  const handleSyncFinished = async () => {
    await reloadProjectData(selectedProjectId);
    await reloadProjects(selectedProjectId);
  };

  const handleRegeneratePortfolio = async (projId: string) => {
    setIsGeneratingPortfolio(true);
    try {
      const report = await apiService.projects.portfolio(Number(projId));
      setPortfolios((prev) => ({ ...prev, [projId]: toPortfolioData(report, projId) }));
    } catch (err) {
      alert(describeError(err, '포트폴리오 생성에 실패했습니다. 먼저 산출물을 수집해 주세요.'));
    } finally {
      setIsGeneratingPortfolio(false);
    }
  };

  const handleGenerateCoverLetter = async (question: string, jobRole: string, projId: string) => {
    const title = projects.find((p) => p.id === projId)?.title ?? '';
    setIsGeneratingCL(true);
    try {
      const star = await apiService.projects.careerStar(Number(projId), { jobRole, question });
      setCoverLetters((prev) => [toCoverLetter(star, projId, title), ...prev]);
    } catch (err) {
      alert(describeError(err, '자소서 생성에 실패했습니다. 먼저 산출물을 수집해 주세요.'));
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleGenerateInterviewQA = async (projId: string) => {
    const jobRole = user?.jobTitle || '백엔드 엔지니어';
    setIsGeneratingQA(true);
    try {
      const res = await apiService.projects.interviewQuestions(Number(projId), { jobRole, questionCount: 3 });
      setInterviewItems(res.questions.map((q, i) => toInterviewItem(q, projId, i)));
    } catch (err) {
      alert(describeError(err, '면접 질문 생성에 실패했습니다. 먼저 산출물을 수집해 주세요.'));
    } finally {
      setIsGeneratingQA(false);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        불러오는 중...
      </div>
    );
  }

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
        onUpdateUser={handleUpdateUser}
      />

      {/* Main App Content View Switcher */}
      <div className="flex-1 min-w-0 flex flex-col justify-between min-h-screen">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              projects={projects}
              timelines={timelines}
              sources={sources}
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
              sources={sources}
              connected={user.connectedServices}
              onSyncFinished={handleSyncFinished}
              onIntegrationsChanged={refreshIntegrations}
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
            <MyPageView user={user} onUpdateUser={handleUpdateUser} />
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
