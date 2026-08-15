import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Github, HardDrive, BookOpen } from 'lucide-react';
import { Project } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'lastUpdated' | 'filesCount' | 'commitsCount' | 'progress'>) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Full Stack / Web');
  const [status, setStatus] = useState<'진행 중' | '완료'>('진행 중');
  const [role, setRole] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [period, setPeriod] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title,
      category,
      status,
      role,
      teamSize,
      period,
      description,
      techStack: techStackInput.split(',').map((s) => s.trim()).filter(Boolean),
      githubRepo: githubRepo || undefined,
      notionUrl: notionUrl || undefined,
      googleDriveUrl: googleDriveUrl || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-6"
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
              <FolderPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="new-project-title" className="text-lg font-bold">새 프로젝트 등록</h2>
              <p className="text-xs text-slate-400">외부 산출물을 연동하고 AI 포트폴리오를 설계할 프로젝트를 추가하세요.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-1">프로젝트명 *</label>
            <input id="newproj-1"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 분산 알림 및 대용량 이벤트 파이프라인 구축"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-2">카테고리</label>
              <input id="newproj-2"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="예: AI / Backend"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-3">진행 상태</label>
              <select id="newproj-3"
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="진행 중">진행 중</option>
                <option value="완료">완료</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-4">본인 역할</label>
              <input id="newproj-4"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="예: 백엔드 리드"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-5">팀 규모</label>
              <input id="newproj-5"
                type="text"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="예: 5인 팀"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-6">진행 기간</label>
              <input id="newproj-6"
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2026.01 ~ 2026.05"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-7">기술 스택 (쉼표 구문)</label>
            <input id="newproj-7"
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="Spring Boot, Kafka, Redis, Docker, React"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700" htmlFor="newproj-8">프로젝트 개요 및 주요 설명</label>
            <textarea id="newproj-8"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="서비스의 핵심 목적 및 주요 기능을 간단히 서술하세요."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          {/* External Links Integration */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 block">외부 저장소 및 서드파티 링크 (선택)</span>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-900 shrink-0" />
                <input
                  type="url"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-800 shrink-0" />
                <input
                  type="url"
                  value={notionUrl}
                  onChange={(e) => setNotionUrl(e.target.value)}
                  placeholder="https://notion.so/workspace/doc"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="url"
                  value={googleDriveUrl}
                  onChange={(e) => setGoogleDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/xyz"
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              프로젝트 생성
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
