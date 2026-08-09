import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  GitCommit,
  RefreshCw,
  Layers,
  Wrench,
  Award,
  BookOpen,
  Zap,
  Tag,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Project, ProjectArtifact, PortfolioData } from '../types';

interface PortfolioArchiveViewProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  portfolio: PortfolioData | null;
  onRegeneratePortfolio: (projectId: string) => Promise<void>;
  artifacts: ProjectArtifact[];
  isGenerating: boolean;
  /** 색인 대기처럼 오래 걸리는 단계에서 지금 무엇을 하는 중인지 알린다. */
  progressMessage?: string | null;
}

export const PortfolioArchiveView: React.FC<PortfolioArchiveViewProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  portfolio,
  onRegeneratePortfolio,
  artifacts,
  isGenerating,
  progressMessage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'portfolio' | 'viewer' | 'commits'>('portfolio');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectArtifacts = artifacts.filter((a) => a.projectId === selectedProjectId);
  const selectedArtifact =
    projectArtifacts.find((a) => a.id === selectedArtifactId) || projectArtifacts[0];

  // Helper to copy complete portfolio as markdown
  const handleCopyMarkdown = () => {
    if (!portfolio) return;

    const mdText = `# ${currentProject?.title ?? ""} - 개발자 포트폴리오

## 1. 프로젝트 한 줄 요약 (Executive Summary)
- **한 줄 요약**: ${portfolio.executiveSummary.oneLineSummary}
- **서비스 목적**: ${portfolio.executiveSummary.servicePurpose}
- **핵심 타겟**: ${portfolio.executiveSummary.targetAudience}
- **진행 기간**: ${portfolio.executiveSummary.period}
- **팀 규모**: ${portfolio.executiveSummary.teamSize}
- **본인 역할**: ${portfolio.executiveSummary.myPosition}

## 2. 기술 스택 및 아키텍처 (Tech Stack & System Design)
### 사용 기술 및 도입 배경
${portfolio.techStackAndArchitecture.techList
  .map((t) => `- **${t.techName}** [${t.category}]: ${t.reasonForAdoption}`)
  .join('\n')}

### 시스템 아키텍처
${portfolio.techStackAndArchitecture.systemArchitectureDesc}

### ERD 및 데이터베이스 스키마
${portfolio.techStackAndArchitecture.erdSummary}

## 3. 핵심 역할 및 기여 (Key Contributions)
${portfolio.keyContributions
  .map((kc) => `### ${kc.title}\n${kc.description}\n- **정량적 성과**: ${kc.impactMetrics}`)
  .join('\n\n')}

## 4. ⭐️ 트러블슈팅 및 문제 해결 과정 (Troubleshooting)
${portfolio.troubleshootingList
  .map(
    (ts) => `### 🛠️ ${ts.title}
- **문제 상황 (Situation)**: ${ts.situation}
- **해결 과정 (Action)**: ${ts.action}
- **결과 (Result)**: ${ts.result}
- **태그**: ${ts.tags.join(', ')}`
  )
  .join('\n\n')}

## 5. 회고 및 배운 점 (Retrospective)
- **기술적 성장**: ${portfolio.retrospective.technicalGrowth}
- **협업 인사이트**: ${portfolio.retrospective.collaborationInsights}
- **향후 개선점**: ${portfolio.retrospective.futureImprovements}
`;

    navigator.clipboard.writeText(mdText);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn break-keep print:m-0 print:p-0">
      
      {/* Top Header Controls (Hidden during print) */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              Gemini 3.6 Flash AI 엔진
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-keep">
              AI 포트폴리오 및 아카이브 뷰어
            </h1>
            <p className="text-xs text-slate-500 break-keep">
              수집된 산출물(코드, 회의록, 아키텍처)을 바탕으로 개발자 맞춤형 포트폴리오를 자동 구조화합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Switcher */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* AI Regenerate Button */}
            <button
              onClick={() => onRegeneratePortfolio(selectedProjectId)}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">
                {isGenerating ? progressMessage ?? 'AI 분석 및 포트폴리오 생성 중...' : 'AI 포트폴리오 자동 구조화'}
              </span>
            </button>

            {/* Export Buttons */}
            {portfolio && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="Markdown 복사"
                >
                  {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="whitespace-nowrap">{copiedMarkdown ? '복사됨!' : 'MD 복사'}</span>
                </button>

                <button
                  onClick={handlePrintPDF}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="PDF / 인쇄 출력"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">인쇄/PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs (Hidden during print) */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSubTab === 'portfolio'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="whitespace-nowrap">AI 포트폴리오 리포트</span>
          </button>

          <button
            onClick={() => setActiveSubTab('viewer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSubTab === 'viewer'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span className="whitespace-nowrap">코드 & 문서 뷰어 ({projectArtifacts.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('commits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSubTab === 'commits'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span className="whitespace-nowrap">커밋 & 회의록 요약</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: AI PORTFOLIO REPORT */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-8">
          {!portfolio ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-4">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-800">포트폴리오가 아직 생성되지 않았습니다</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                아래 [AI 포트폴리오 자동 구조화] 버튼을 누르면 Gemini 3.6 Flash가 깃 커밋 및 회의록을 종합하여 5대 기술 항목으로 자동 작성합니다.
              </p>
              <button
                onClick={() => onRegeneratePortfolio(selectedProjectId)}
                className="px-5 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-colors"
              >
                지금 AI 포트폴리오 생성하기
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-md space-y-12 print:shadow-none print:border-none print:p-0">
              
              {/* Portfolio Document Title Header */}
              <div className="border-b-2 border-slate-900 pb-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-widest text-blue-600">Developer Portfolio Report</span>
                  <span>최종 AI 동기화: {portfolio.updatedAt}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {currentProject?.title ?? ""}
                </h1>
                <p className="text-base text-slate-700 font-medium leading-relaxed bg-blue-50/70 p-4 rounded-2xl border border-blue-200/60">
                  “{portfolio.executiveSummary.oneLineSummary}”
                </p>
              </div>

              {/* 1. 프로젝트 한 줄 요약 (Executive Summary) */}
              <section className="space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  1. 프로젝트 한 줄 요약 (Executive Summary)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-500 block">서비스 목적 및 가치</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{portfolio.executiveSummary.servicePurpose}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-500 block">핵심 타겟 사용자</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{portfolio.executiveSummary.targetAudience}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs text-center bg-slate-100 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 font-semibold block">진행 기간</span>
                    <strong className="text-slate-900 font-bold">{portfolio.executiveSummary.period}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">팀 규모</span>
                    <strong className="text-slate-900 font-bold">{portfolio.executiveSummary.teamSize}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">본인 포지션</span>
                    <strong className="text-blue-700 font-extrabold">{portfolio.executiveSummary.myPosition}</strong>
                  </div>
                </div>
              </section>

              {/* 2. 기술 스택 및 아키텍처 (Tech Stack & System Design) */}
              <section className="space-y-5">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  2. 기술 스택 및 아키텍처 (Tech Stack & System Design)
                </h2>

                {/* Tech Stack Table with '도입 배경' */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">기술 스택 (Tech)</th>
                        <th className="p-3.5">구분</th>
                        <th className="p-3.5">도입 배경 및 선택 이유 (Reason for Adoption)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {portfolio.techStackAndArchitecture.techList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900">{item.techName}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700 leading-relaxed">{item.reasonForAdoption}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* System Architecture Description */}
                <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl space-y-2 font-mono text-xs">
                  <span className="text-blue-400 font-bold uppercase tracking-wider block">System Architecture Diagram & Flow</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{portfolio.techStackAndArchitecture.systemArchitectureDesc}</p>
                </div>

                {/* ERD Summary */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    데이터베이스 ERD & 스키마 설계 요약
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{portfolio.techStackAndArchitecture.erdSummary}</p>
                </div>
              </section>

              {/* 3. 핵심 역할 및 기여 (Key Contributions) */}
              <section className="space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  3. 핵심 역할 및 기여 (Key Contributions)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolio.keyContributions.map((kc) => (
                    <div key={kc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h3 className="font-bold text-slate-900 text-sm">{kc.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{kc.description}</p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                        <Award className="w-3.5 h-3.5" />
                        <span>성과: {kc.impactMetrics}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. ⭐️ 트러블슈팅 및 문제 해결 과정 (Troubleshooting STAR Framework) */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-l-4 border-blue-600 pl-3">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    4. ⭐️ 트러블슈팅 및 문제 해결 과정 (Troubleshooting)
                  </h2>
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full">
                    STAR Framework
                  </span>
                </div>

                <div className="space-y-6">
                  {portfolio.troubleshootingList.map((ts, idx) => (
                    <div
                      key={ts.id || idx}
                      className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-rose-600" />
                          {ts.title}
                        </h3>

                        <div className="flex items-center gap-1">
                          {ts.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Situation */}
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                          <span className="font-extrabold text-amber-700 block uppercase tracking-wider text-[10px]">
                            문제 상황 (Situation)
                          </span>
                          <p className="text-slate-700 leading-relaxed">{ts.situation}</p>
                        </div>

                        {/* Action */}
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                          <span className="font-extrabold text-blue-700 block uppercase tracking-wider text-[10px]">
                            해결 과정 (Action)
                          </span>
                          <p className="text-slate-700 leading-relaxed">{ts.action}</p>
                        </div>

                        {/* Result */}
                        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
                          <span className="font-extrabold text-emerald-800 block uppercase tracking-wider text-[10px]">
                            결과 및 성과 (Result)
                          </span>
                          <p className="text-emerald-950 font-bold leading-relaxed">{ts.result}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. 회고 및 배운 점 (Retrospective) */}
              <section className="space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  5. 회고 및 배운 점 (Retrospective)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-blue-700 block">기술적 성장 (Technical Growth)</span>
                    <p className="text-slate-700 leading-relaxed font-medium">{portfolio.retrospective.technicalGrowth}</p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-indigo-700 block">협업 인사이트 (Collaboration)</span>
                    <p className="text-slate-700 leading-relaxed font-medium">{portfolio.retrospective.collaborationInsights}</p>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-emerald-700 block">향후 개선점 (Future Roadmap)</span>
                    <p className="text-slate-700 leading-relaxed font-medium">{portfolio.retrospective.futureImprovements}</p>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: CODE & DOC VIEWER */}
      {activeSubTab === 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Artifact List Sidebar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">아카이빙된 산출물 목록</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {projectArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifactId(art.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    (selectedArtifact?.id === art.id)
                      ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-900 truncate mb-1">{art.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="capitalize">{art.type}</span>
                    <span>{art.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Viewer Code Pane */}
          <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 space-y-4">
            {selectedArtifact ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedArtifact.title}</h3>
                    <p className="text-[11px] text-slate-400">작성자: {selectedArtifact.author} | {selectedArtifact.timestamp}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-900 text-blue-200 text-xs font-mono font-bold rounded-md">
                    {selectedArtifact.language || selectedArtifact.type}
                  </span>
                </div>

                <pre className="font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[500px]">
                  {selectedArtifact.content}
                </pre>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">산출물을 선택하세요.</div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 3: COMMITS & MEETING LOGS */}
      {activeSubTab === 'commits' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">커밋 히스토리 및 핵심 회의록 스냅샷</h3>
          <p className="text-xs text-slate-500">
            외부 연동된 커밋 및 스크럼 회의록 원본에서 AI가 중요한 의사결정 포인트를 요약하여 제공합니다.
          </p>

          <div className="space-y-3 pt-2">
            {projectArtifacts.map((art) => (
              <div key={art.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{art.title}</span>
                  <span className="text-[10px] text-slate-500">{art.timestamp}</span>
                </div>
                <p className="text-slate-600 line-clamp-3 leading-relaxed">{art.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
