import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  Copy,
  Check,
  HelpCircle,
  FileText,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Award,
  Layers,
  Wrench,
  MessageSquare
} from 'lucide-react';
import { Project, CoverLetterQA, InterviewPrepItem } from '../types';

interface CareerToolsViewProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  coverLetters: CoverLetterQA[];
  onGenerateCoverLetter: (question: string, jobRole: string, projectId: string) => Promise<void>;
  interviewItems: InterviewPrepItem[];
  onGenerateInterviewQA: (projectId: string) => Promise<void>;
  isGeneratingCL: boolean;
  isGeneratingQA: boolean;
}

export const CareerToolsView: React.FC<CareerToolsViewProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  coverLetters,
  onGenerateCoverLetter,
  interviewItems,
  onGenerateInterviewQA,
  isGeneratingCL,
  isGeneratingQA,
}) => {
  const [activeTab, setActiveTab] = useState<'cover_letter' | 'interview'>('cover_letter');

  // Cover Letter Form State
  const [clQuestion, setClQuestion] = useState('가장 도전적인 기술적 문제를 스스로의 노력으로 극복하고 성과를 낸 경험에 대해 서술해 주세요.');
  const [clJobRole, setClJobRole] = useState('백엔드 / AI 엔지니어');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCLSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clQuestion.trim()) return;
    onGenerateCoverLetter(clQuestion, clJobRole, selectedProjectId);
  };

  return (
    <div className="space-y-8 animate-fadeIn break-keep">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold mb-2 whitespace-nowrap">
              <Briefcase className="w-3.5 h-3.5 text-slate-700" />
              취업 지원 맞춤 AI 파이프라인
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-keep">
              자소서 & 실전 면접 질문·모범 답변 생성기
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mt-1 break-keep">
              아카이빙된 시스템 아키텍처와 트러블슈팅 경험을 바탕으로 합격률을 높이는 자소서와 모범 답변을 자동 제안합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">활용 프로젝트:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cover_letter')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'cover_letter'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="whitespace-nowrap">자소서 맞춤 답변 생성기</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'interview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="whitespace-nowrap">실전 면접 예상 질문 & 모범 답변</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COVER LETTER (자소서 답변 생성) */}
      {activeTab === 'cover_letter' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-slate-900" />
              자기소개서 문항 기반 STAR 답변 생성
            </h2>

            <form onSubmit={handleCLSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">지원 직무</label>
                  <input
                    type="text"
                    required
                    value={clJobRole}
                    onChange={(e) => setClJobRole(e.target.value)}
                    placeholder="예: 백엔드 리드, AI 데이터 엔지니어"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">대상 프로젝트</label>
                  <input
                    type="text"
                    disabled
                    value={currentProject.title}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">자소서 항목 / 질문 입력</label>
                <textarea
                  required
                  rows={3}
                  value={clQuestion}
                  onChange={(e) => setClQuestion(e.target.value)}
                  placeholder="예: 프로젝트 진행 중 기술적 갈등 상황이나 아키텍처 한계를 극복했던 사례를 기술하시오."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingCL}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingCL ? 'animate-spin' : ''}`} />
                <span>{isGeneratingCL ? 'Gemini AI 자소서 작성 중...' : '✨ 맞춤형 STAR 자소서 답변 생성'}</span>
              </button>
            </form>
          </div>

          {/* Cover Letter Results */}
          <div className="space-y-6">
            {coverLetters.map((cl) => (
              <div key={cl.id} className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                        {cl.jobTarget}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">프로젝트: {cl.projectTitle}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Q. {cl.question}</h3>
                  </div>

                  <button
                    onClick={() => handleCopyText(cl.generatedAnswer, cl.id)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedId === cl.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === cl.id ? '복사 완료' : '본문 복사'}</span>
                  </button>
                </div>

                {/* STAR Breakdown Box */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-700 block mb-1">Situation (상황)</span>
                    <p className="text-slate-700 leading-relaxed">{cl.starBreakdown.situation}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Task (과제)</span>
                    <p className="text-slate-700 leading-relaxed">{cl.starBreakdown.task}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Action (행동)</span>
                    <p className="text-slate-700 leading-relaxed">{cl.starBreakdown.action}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-800 block mb-1">Result (성과)</span>
                    <p className="text-emerald-950 font-semibold leading-relaxed">{cl.starBreakdown.result}</p>
                  </div>
                </div>

                {/* Generated Answer Body */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">생성된 완성본 답변</span>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {cl.generatedAnswer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERVIEW PREP (면접 질문 및 모범 답변) */}
      {activeTab === 'interview' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-slate-900" />
                프로젝트 아키텍처 기반 실전 기술 면접 예상 질문 제안
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                [{currentProject.title}]의 기술 스택 및 트러블슈팅을 바탕으로 면접관이 실제로 물어볼 핵심 질문과 모범 답변을 도출합니다.
              </p>
            </div>

            <button
              onClick={() => onGenerateInterviewQA(selectedProjectId)}
              disabled={isGeneratingQA}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingQA ? 'animate-spin' : ''}`} />
              <span>{isGeneratingQA ? '면접 질문 분석 중...' : '✨ 실전 면접 예상 질문 & 모범 답변 제안'}</span>
            </button>
          </div>

          {/* Interview Cards List */}
          <div className="space-y-6">
            {interviewItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">생성된 면접 질문이 없습니다. 상단 [실전 면접 예상 질문 제안] 버튼을 누르세요.</p>
              </div>
            ) : (
              interviewItems.map((item, idx) => (
                <div key={item.id || idx} className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                  {/* Category & Question */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">예상 출제율 높음</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-blue-600 font-extrabold shrink-0">Q{idx + 1}.</span>
                      <span>{item.question}</span>
                    </h3>
                  </div>

                  {/* Sample Answer Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        합격 모범 답변 (STAR)
                      </span>
                      <button
                        onClick={() => handleCopyText(item.sampleAnswer, item.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === item.id ? '복사됨' : '답변 복사'}</span>
                      </button>
                    </div>

                    <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {item.sampleAnswer}
                    </div>
                  </div>

                  {/* Key Evaluation Points & Follow Ups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 block">🎯 면접관 평가 체크포인트</span>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        {item.keyCheckingPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-800 block">💬 예상 꼬리 질문 (Follow-up)</span>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        {item.followUpQuestions.map((fq, i) => (
                          <li key={i}>{fq}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
