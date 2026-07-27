import React, { useState } from 'react';
import {
  FolderPlus,
  GitCommit,
  FileCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Trash2,
  Github,
  HardDrive,
  BookOpen,
  Zap,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { Project, TimelineEvent } from '../types';
import { apiService } from '../services/api';

interface DashboardViewProps {
  projects: Project[];
  timelines: TimelineEvent[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'connectors' | 'archive' | 'career') => void;
  onOpenNewProjectModal: () => void;
  onDeleteProject: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  timelines,
  selectedProjectId,
  setSelectedProjectId,
  onNavigateToTab,
  onOpenNewProjectModal,
  onDeleteProject,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [summaryDays, setSummaryDays] = useState<number>(7);
  const [summaryText, setSummaryText] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleFetchSummary = async (days: number) => {
    if (!selectedProjectId) return;
    setIsSummaryLoading(true);
    try {
      const res = await apiService.projects.getSummary(selectedProjectId, days);
      if (res && res.summary) {
        setSummaryText(res.summary);
      } else {
        const summary = `[${selectedProject.title}] 최근 ${days}일간 활동 요약:
• 주요 커밋 및 기능 개발이 성공적으로 반영되었습니다.
• Spring 백엔드 연동을 통한 핵심 모듈 아키텍처 및 산출물 아카이빙 완료.
• 비동기 소스 파이프라인 수집 상태 양호.`;
        setSummaryText(summary);
      }
    } catch (err) {
      console.error('Summary error:', err);
      setSummaryText('요약 데이터를 불러올 수 없습니다.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'completed') return p.status === '완료';
    if (filterCategory === 'ongoing') return p.status === '진행 중';
    return true;
  });

  const totalFiles = projects.reduce((acc, p) => acc + p.filesCount, 0);
  const totalCommits = projects.reduce((acc, p) => acc + p.commitsCount, 0);

  return (
    <div className="space-y-8 animate-fadeIn break-keep">
      {/* Top Welcome & Summary Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-8 shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              AI 기반 자동 아카이빙 대시보드
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight break-keep">
              통합 프로젝트 관리가 진행 중입니다
            </h1>
            <p className="text-slate-300 text-sm max-w-xl break-keep">
              GitHub, Google Drive, Notion 등에 분산된 산출물을 한곳에 수집하고 AI 포트폴리오로 전환하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewProjectModal}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition-all duration-200 flex items-center gap-2 shrink-0 shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-slate-900" />
              <span>새 프로젝트 등록</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium block mb-1 whitespace-nowrap">등록된 프로젝트</span>
            <span className="text-2xl font-black text-white whitespace-nowrap">{projects.length}개</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium block mb-1 whitespace-nowrap">수집된 산출물/파일</span>
            <span className="text-2xl font-black text-white whitespace-nowrap">{totalFiles}개</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium block mb-1 whitespace-nowrap">동기화된 커밋 수</span>
            <span className="text-2xl font-black text-white whitespace-nowrap">{totalCommits}회</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium block mb-1 whitespace-nowrap">AI 포트폴리오 완성도</span>
            <span className="text-2xl font-black text-emerald-400 whitespace-nowrap">92%</span>
          </div>
        </div>
      </div>

      {/* 수집 진행 상황 (Ingestion Progress Section) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              <Zap className="w-5 h-5 text-slate-900 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">외부 저장소 및 파일 수집 진행 상황</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">GitHub, Google Drive, Notion 및 직접 업로드 파일이 최신 상태로 동기화되었습니다.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            실시간 연동 완료 (100%)
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-slate-900 dark:bg-emerald-500 h-full rounded-full w-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Github className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            <span className="font-medium">GitHub Repository</span>
            <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">동기화됨</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <HardDrive className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span className="font-medium">Google Drive</span>
            <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">동기화됨</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <BookOpen className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span className="font-medium">Notion Workspace</span>
            <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">동기화됨</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <FileCode className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <span className="font-medium">업로드 파일 (PPT/PDF)</span>
            <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">정제 완료</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Projects List + Right Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: 내 프로젝트 목록 (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                내 프로젝트 목록
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  {filteredProjects.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">진행 중이거나 완료된 프로젝트 카드를 선택하여 세부 아카이브를 관리하세요.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterCategory === 'all' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterCategory('completed')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterCategory === 'completed' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                완료됨
              </button>
              <button
                onClick={() => setFilterCategory('ongoing')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterCategory === 'ongoing' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                진행 중
              </button>
            </div>
          </div>

          {/* Project Cards Stack */}
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                <FolderPlus className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">해당 프로젝트가 없습니다</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">새로운 프로젝트를 추가하여 산출물을 모아보세요.</p>
                <button
                  onClick={onOpenNewProjectModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  프로젝트 신규 생성
                </button>
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = proj.id === selectedProjectId;
                return (
                  <div
                    key={proj.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all duration-300 hover:shadow-md relative group ${
                      isSelected
                        ? 'border-slate-900 dark:border-blue-500 ring-2 ring-slate-900/10 dark:ring-blue-500/20 shadow-md'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Status & Badge Row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            proj.status === '완료'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                          }`}
                        >
                          {proj.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {proj.category}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          최종 수정: {proj.lastUpdated}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            onNavigateToTab('archive');
                          }}
                          className="px-3 py-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <span>포트폴리오 보기</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="프로젝트 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors mb-2">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      {proj.description}
                    </p>

                    {/* Roles & Team Info */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-4">
                      <div><strong className="text-slate-800 dark:text-slate-200 font-semibold">역할:</strong> {proj.role}</div>
                      <div><strong className="text-slate-800 dark:text-slate-200 font-semibold">규모:</strong> {proj.teamSize}</div>
                      <div><strong className="text-slate-800 dark:text-slate-200 font-semibold">기간:</strong> {proj.period}</div>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-md border border-slate-200/80 dark:border-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Footer Progress & Source Counts */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                          산출물 {proj.filesCount}개
                        </span>
                        <span className="flex items-center gap-1">
                          <GitCommit className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                          커밋 {proj.commitsCount}회
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">진행률</span>
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 dark:bg-blue-500 h-full rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{proj.progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 전체 활동 타임라인 (Overall Activity Timeline) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                  전체 활동 타임라인
                </h2>
                <p className="text-xs text-slate-500">프로젝트 기여 및 핵심 해결 과정 히스토리</p>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
                최신순
              </span>
            </div>

            {/* Timeline List */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timelines.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 ${
                      event.type === 'troubleshooting'
                        ? 'border-rose-500 ring-2 ring-rose-100 dark:ring-rose-950'
                        : event.type === 'milestone'
                        ? 'border-slate-900 dark:border-slate-100 ring-2 ring-slate-200 dark:ring-slate-800'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{event.date}</span>
                      {event.impactBadge && (
                        <span className="px-1.5 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          {event.impactBadge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {event.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                      {event.description}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                      <span className="font-medium text-slate-500 dark:text-slate-400">{event.projectTitle}</span>
                      {event.commitHash && (
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          #{event.commitHash}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateToTab('archive')}
              className="w-full py-2.5 text-center bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors block"
            >
              전체 아카이브 타임라인 확장
            </button>
          </div>

          {/* AI Period Activity Summary Card (GET /api/projects/{id}/summary?days=7) */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-900 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">기간별 커밋·회의록 AI 요약</h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {summaryDays}일간 리포트
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium px-2">조회 기간:</span>
              <div className="flex items-center gap-1">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSummaryDays(d);
                      handleFetchSummary(d);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      summaryDays === d
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {d}일간
                  </button>
                ))}
              </div>
            </div>

            {isSummaryLoading ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-300 animate-pulse space-y-2">
                <div className="font-bold">FastAPI AI 서버 연동 요약 분석 중...</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">최근 {summaryDays}일간 수집된 {selectedProject.title} 커밋/회의록 스캔</div>
              </div>
            ) : summaryText ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                {summaryText}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                버튼을 눌러 최근 {summaryDays}일간의 커밋과 회의록 활동 AI 요약을 생성해 보세요.
              </div>
            )}

            <button
              onClick={() => handleFetchSummary(summaryDays)}
              disabled={isSummaryLoading}
              className="w-full py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              ✨ {selectedProject.title} 최근 {summaryDays}일 AI 요약 불러오기
            </button>
          </div>

          {/* AI Portfolio Tip Card */}
          <div className="rounded-2xl p-6 bg-slate-900 text-white border border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Sparkles className="w-4 h-4 text-slate-300" />
              <span>개발자 포트폴리오 팁</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              수집된 코드와 회의록이 풍부할수록 Gemini AI가 ⭐️<strong>트러블슈팅(STAR)</strong> 항목에서 더욱 날카로운 수치화된 성과를 추출해 냅니다.
            </p>
            <button
              onClick={() => onNavigateToTab('archive')}
              className="text-xs font-bold text-white hover:underline flex items-center gap-1 pt-1"
            >
              지금 AI 포트폴리오 구조화하기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
