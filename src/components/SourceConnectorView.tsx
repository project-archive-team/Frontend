import React, { useEffect, useRef, useState } from 'react';
import {
  Github,
  HardDrive,
  BookOpen,
  UploadCloud,
  FileText,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Code2,
  FileSpreadsheet,
  Zap,
  Tag
} from 'lucide-react';
import { Project, ProjectArtifact, SourceView, User } from '../types';
import { apiService } from '../services/api';
import { ConfirmDialog, ConfirmDialogState } from './ConfirmDialog';

interface SourceConnectorViewProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  artifacts: ProjectArtifact[];
  onAddArtifact: (artifact: Omit<ProjectArtifact, 'id' | 'timestamp'>) => void | Promise<void>;
  onDeleteArtifact: (id: string) => void | Promise<void>;
  sources: SourceView[];
  connected: User['connectedServices'];
  onSyncFinished: () => void | Promise<void>;
  onIntegrationsChanged: () => void | Promise<void>;
}

/** 카드 배지는 실제 토큰 보유 여부를 보여준다. 색 토큰은 이 파일이 이미 쓰던 두 가지를 그대로 쓴다. */
const BADGE_ON = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200';
const BADGE_OFF = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-900 border border-slate-200';

export const SourceConnectorView: React.FC<SourceConnectorViewProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  artifacts,
  onAddArtifact,
  onDeleteArtifact,
  sources,
  connected,
  onSyncFinished,
  onIntegrationsChanged,
}) => {
  const [activeService, setActiveService] = useState<'github' | 'drive' | 'notion' | 'upload'>('upload');
  
  // Custom File Upload Form State
  const [fileTitle, setFileTitle] = useState('');
  const [fileType, setFileType] = useState<'code' | 'document' | 'meeting_note' | 'architecture'>('document');
  const [fileContent, setFileContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [artifactTypeFilter, setArtifactTypeFilter] = useState<'ALL' | 'COMMIT' | 'CODE' | 'DOC' | 'MEETING'>('ALL');

  // Notion Integration State
  const [notionTokenInput, setNotionTokenInput] = useState('');
  const [notionWorkspaceInput, setNotionWorkspaceInput] = useState('');
  const [isSavingNotion, setIsSavingNotion] = useState(false);

  // Async Sync State (HTTP 202)
  const [isSyncingAsync, setIsSyncingAsync] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const pollTimer = useRef<number | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);
  const [sourceRefInput, setSourceRefInput] = useState('');
  const [isSavingSource, setIsSavingSource] = useState(false);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const currentArtifacts = artifacts.filter((a) => a.projectId === selectedProjectId);
  // github/drive 탭은 각자의 소스만 본다. 하나로 뭉쳐 보여주면 Drive 탭에서 GitHub 저장소가 떠서
  // 주소가 고정된 것처럼 보인다.
  const activeType: SourceView['type'] =
    activeService === 'github' ? 'GITHUB' : activeService === 'notion' ? 'NOTION' : 'GDRIVE';
  const activeSources = sources.filter((s) => s.type === activeType);
  const activeSourceRef = activeSources[0]?.externalRef;
  const activeLabel =
    activeService === 'github' ? 'GitHub' : activeService === 'notion' ? 'Notion' : 'Google Drive';
  const activeConnected =
    activeService === 'github'
      ? Boolean(connected?.github)
      : activeService === 'notion'
      ? Boolean(connected?.notion)
      : Boolean(connected?.googleDrive);

  // 백엔드가 워크스페이스 이름을 저장하지 않는다 — 토큰 보유 여부만 사실대로 보여준다.
  const notionStatus = {
    connected: Boolean(connected?.notion),
    workspaceName: connected?.notion ? '연결됨' : '미연결',
    tokenMasked: connected?.notion ? '저장됨 (secret_****)' : '등록된 토큰 없음',
  };

  // 화면을 벗어나면 폴링을 멈춘다.
  useEffect(() => () => {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
  }, []);

  // OAuth를 다녀왔으면 보던 탭과 입력값을 되살린다.
  useEffect(() => {
    const service = sessionStorage.getItem('return_service');
    if (service) {
      sessionStorage.removeItem('return_service');
      setActiveService(service as typeof activeService);
    }
    const pending = sessionStorage.getItem('pending_source_ref');
    if (pending) {
      sessionStorage.removeItem('pending_source_ref');
      setSourceRefInput(pending);
    }
  }, []);

  const handleSaveNotionToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notionTokenInput) return;
    setIsSavingNotion(true);
    try {
      await apiService.integrations.setNotionToken(notionTokenInput);
      setNotionTokenInput('');
      await onIntegrationsChanged();
      setDialog({ title: 'Notion 연결 완료', message: 'Integration 토큰이 저장되었습니다.', noticeOnly: true });
    } catch (err) {
      console.error(err);
      setDialog({
        title: 'Notion 토큰 저장 실패',
        message: err instanceof Error ? err.message : '토큰 저장 중 오류가 발생했습니다.',
        noticeOnly: true,
      });
    } finally {
      setIsSavingNotion(false);
    }
  };

  /** 수집 대상 등록. 프로젝트 생성 뒤에도 여기서 추가·교체할 수 있어야 한다. */
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = sourceRefInput.trim();
    // Notion은 대상을 비워두면 integration에 공유된 페이지 전체를 긁는다. 나머지는 주소가 있어야 한다.
    if (!ref && activeType !== 'NOTION') return;
    if (!selectedProjectId) {
      setDialog({
        title: '프로젝트가 필요합니다',
        message: '수집 대상은 프로젝트에 붙습니다.\n왼쪽 위 [+ 생성]으로 프로젝트를 먼저 만들어 주세요.',
        noticeOnly: true,
      });
      return;
    }
    setIsSavingSource(true);
    try {
      const added = await apiService.projects.addSource(Number(selectedProjectId), {
        type: activeType,
        externalRef: ref || null,
      });
      setSourceRefInput('');
      await onSyncFinished();
      if (added.length > 1) {
        setDialog({
          title: `저장소 ${added.length}개를 등록했습니다`,
          message: `조직 아래 저장소를 각각의 수집 대상으로 나눴습니다.\n\n${added
            .map((s) => `· ${s.externalRef}`)
            .join('\n')}\n\n필요 없는 저장소는 목록에서 삭제할 수 있습니다.`,
          noticeOnly: true,
        });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      // 조직 등록은 저장소 목록 조회에 토큰이 필요하다. 계정이 안 붙어 있으면 여기서 바로 붙이게 한다.
      if (!activeConnected) {
        promptLogin(reason, ref);
      } else {
        setDialog({ title: '수집 대상 등록 실패', message: reason, noticeOnly: true });
      }
    } finally {
      setIsSavingSource(false);
    }
  };

  /**
   * 로그인하러 보내는 모달. 돌아왔을 때 이 화면과 입력값을 그대로 살려 두어야
   * 사용자가 주소를 다시 치지 않는다.
   */
  const promptLogin = (reason: string, pendingRef?: string) => {
    // Notion은 OAuth가 아니라 토큰 붙여넣기라 로그인 화면으로 보낼 곳이 없다.
    if (activeService === 'notion') {
      setDialog({
        title: 'Notion 토큰이 필요합니다',
        message: `${reason}\n\n위 입력란에 Integration 토큰을 먼저 저장해 주세요.`,
        noticeOnly: true,
      });
      return;
    }
    const provider = activeService === 'github' ? ('github' as const) : ('google' as const);
    setDialog({
      title: `${activeLabel} 로그인이 필요합니다`,
      message: `${reason}\n\n로그인하면 이 화면으로 돌아오고, 입력하신 주소도 그대로 남아 있습니다.`,
      confirmLabel: `${activeLabel}로 로그인`,
      onConfirm: () => {
        sessionStorage.setItem('return_tab', 'connectors');
        sessionStorage.setItem('return_service', activeService);
        if (pendingRef) {
          sessionStorage.setItem('pending_source_ref', pendingRef);
        }
        apiService.auth.linkProvider(provider);
      },
    });
  };

  const handleRemoveSource = async (sourceId: number) => {
    try {
      await apiService.projects.removeSource(Number(selectedProjectId), sourceId);
      await onSyncFinished();
    } catch (err) {
      setDialog({
        title: '수집 대상 삭제 실패',
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        noticeOnly: true,
      });
    }
  };

  /**
   * 이 프로젝트가 실제로 등록한 소스 중 아직 계정이 연결되지 않은 게 있으면 여기서 연결시킨다.
   *
   * GitHub/Google은 OAuth라 페이지를 떠났다 돌아온다 — 돌아왔을 때 이 화면으로 복귀하도록
   * 목적지를 남겨둔다. Notion은 토큰 붙여넣기라 같은 화면의 탭만 바꾼다.
   *
   * @returns 동기화를 계속해도 되면 true
   */
  const ensureConnected = (): boolean => {
    const need = (type: SourceView['type']) => sources.some((s) => s.type === type);

    if (sources.length === 0) {
      setDialog({
        title: '수집 대상이 없습니다',
        message:
          '이 프로젝트에 등록된 수집 대상이 하나도 없습니다.\n아래 입력란에 저장소 주소를 등록한 뒤 다시 동기화해 주세요.',
        noticeOnly: true,
      });
      return false;
    }

    if (need('NOTION') && !connected?.notion) {
      setActiveService('notion');
      setDialog({
        title: 'Notion 토큰이 필요합니다',
        message:
          'Notion은 OAuth가 아니라 Integration 토큰으로 연결합니다.\n아래 입력란에 토큰을 저장한 뒤 다시 동기화해 주세요.',
        noticeOnly: true,
      });
      return false;
    }

    const missing = need('GITHUB') && !connected?.github
      ? { provider: 'github' as const, label: 'GitHub' }
      : need('GDRIVE') && !connected?.googleDrive
      ? { provider: 'google' as const, label: 'Google' }
      : null;

    if (!missing) return true;

    setDialog({
      title: `${missing.label} 로그인이 필요합니다`,
      message: `${missing.label} 계정이 연결되어 있지 않아 수집할 수 없습니다.\n로그인하면 이 화면으로 돌아와 바로 동기화할 수 있습니다.`,
      confirmLabel: `${missing.label}로 로그인`,
      onConfirm: () => {
        sessionStorage.setItem('return_tab', 'connectors');
        sessionStorage.setItem('return_service', missing.provider === 'github' ? 'github' : 'drive');
        apiService.auth.linkProvider(missing.provider);
      },
    });
    return false;
  };

  /**
   * 동기화는 202로 시작만 하고 실제 진행은 소스별 상태를 폴링해서 따라간다.
   * 진행률은 "끝난 소스 / 전체 소스"로 계산한다 — 백엔드가 퍼센트를 주지 않는다.
   */
  const handleTriggerAsyncSync = async () => {
    // 프로젝트가 없으면 조용히 아무것도 안 하는 게 아니라, 무엇을 해야 하는지 알려준다.
    if (!selectedProjectId) {
      setDialog({
        title: '프로젝트가 필요합니다',
        message: '수집은 프로젝트 단위로 이뤄집니다.\n왼쪽 위 [+ 생성]으로 프로젝트를 먼저 만들어 주세요.',
        noticeOnly: true,
      });
      return;
    }
    const projectId = Number(selectedProjectId);

    // 토큰이 없으면 수집기가 소스를 FAILED로 떨구고 끝난다. 돌리기 전에 연결부터 잡는다.
    if (!ensureConnected()) return;

    setIsSyncingAsync(true);
    setSyncProgress(5);
    setSyncMessage('수집 작업을 생성하는 중...');

    try {
      await apiService.projects.startSync(projectId);
    } catch (err) {
      setIsSyncingAsync(false);
      setSyncProgress(null);
      setSyncMessage('');
      setDialog({
        title: '동기화를 시작하지 못했습니다',
        message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        noticeOnly: true,
      });
      return;
    }

    const poll = async () => {
      try {
        const status = await apiService.projects.syncStatus(projectId);
        const total = status.sources.length || 1;
        const settled = status.sources.filter((s) => s.status === 'DONE' || s.status === 'FAILED').length;
        const failed = status.sources.filter((s) => s.status === 'FAILED');

        if (status.status === 'ANALYZING') {
          const running = status.sources.find((s) => s.status === 'SYNCING');
          // 소스가 다 끝나도 AI 색인이 남아 있다. 수집을 80%까지로 두고 나머지는 색인 몫으로 남긴다 —
          // 안 그러면 100%를 찍어 놓고 한참 더 기다리게 된다.
          if (settled === total && !running) {
            setSyncProgress(90);
            setSyncMessage('수집 완료. 수집한 자료를 AI가 색인하는 중입니다...');
          } else {
            setSyncProgress(Math.max(10, Math.round((settled / total) * 80)));
            setSyncMessage(running ? `${running.type} 수집 중...` : '소스 파이프라인 진행 중...');
          }
          pollTimer.current = window.setTimeout(poll, 2000);
          return;
        }

        setSyncProgress(100);
        setSyncMessage(
          failed.length > 0
            ? `일부 소스 실패: ${failed.map((f) => `${f.type}(${f.message ?? '원인 미상'})`).join(', ')}`
            : '수집 완료! 최신 산출물이 반영되었습니다.'
        );
        await onSyncFinished();
        // 실패 메시지는 사용자가 읽을 시간을 준다.
        pollTimer.current = window.setTimeout(() => {
          setIsSyncingAsync(false);
          setSyncProgress(null);
        }, failed.length > 0 ? 6000 : 1500);
      } catch (err) {
        console.error(err);
        setSyncMessage('진행 상황을 불러오지 못했습니다.');
        setIsSyncingAsync(false);
        setSyncProgress(null);
      }
    };

    pollTimer.current = window.setTimeout(poll, 1000);
  };

  const filteredArtifacts = currentArtifacts.filter((a) => {
    // Artifact type mapping filter (COMMIT | CODE | DOC | MEETING)
    if (artifactTypeFilter !== 'ALL') {
      if (artifactTypeFilter === 'COMMIT' && a.type !== 'commit') return false;
      if (artifactTypeFilter === 'CODE' && a.type !== 'code') return false;
      if (artifactTypeFilter === 'DOC' && a.type !== 'document' && a.type !== 'architecture') return false;
      if (artifactTypeFilter === 'MEETING' && a.type !== 'meeting_note') return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle.trim() || !fileContent.trim()) return;
    if (!selectedProjectId) {
      setDialog({
        title: '프로젝트가 필요합니다',
        message: '산출물은 프로젝트에 등록됩니다.\n왼쪽 위 [+ 생성]으로 프로젝트를 먼저 만들어 주세요.',
        noticeOnly: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(35);
    try {
      await onAddArtifact({
        projectId: selectedProjectId,
        title: fileTitle.trim(),
        type: fileType,
        content: fileContent,
        author: '',
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setUploadProgress(100);
      setFileTitle('');
      setFileContent('');
      setTagsInput('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn break-keep">
      <ConfirmDialog state={dialog} onClose={() => setDialog(null)} />

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold mb-2 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-slate-700" />
              멀티 소스 인제스천 파이프라인
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-keep">
              외부 저장소 연동 및 파일 수집
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mt-1 break-keep">
              GitHub 레포지토리, Google Drive, Notion 문서와 직접 업로드한 PPT/PDF/MD 산출물을 모아 AI 학습 맥락으로 활용합니다.
            </p>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">대상 프로젝트:</span>
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
      </div>

      {/* External Storage Connector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* GitHub Card */}
        <div
          onClick={() => setActiveService('github')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 ${
            activeService === 'github'
              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Github className="w-5 h-5" />
            </div>
            <span className={connected?.github ? BADGE_ON : BADGE_OFF}>
              {connected?.github ? '연결됨' : '연결 필요'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">GitHub</h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            커밋 히스토리, PR 및 소스 코드를 실시간 동기화합니다.
          </p>
        </div>

        {/* Google Drive Card */}
        <div
          onClick={() => setActiveService('drive')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 ${
            activeService === 'drive'
              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-200">
              <HardDrive className="w-5 h-5 text-slate-800" />
            </div>
            <span className={connected?.googleDrive ? BADGE_ON : BADGE_OFF}>
              {connected?.googleDrive ? '연결됨' : '연결 필요'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Google Drive</h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            PPT·PDF·문서와 코드 파일까지 하위 폴더째 수집.
          </p>
        </div>

        {/* Notion Card */}
        <div
          onClick={() => setActiveService('notion')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 ${
            activeService === 'notion'
              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-200">
              <BookOpen className="w-5 h-5 text-slate-800" />
            </div>
            <span className={connected?.notion ? BADGE_ON : BADGE_OFF}>
              {connected?.notion ? '연결됨' : '토큰 필요'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Notion Workspace</h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            팀 회의록, 기술 사양서 및 데일리 스크럼 블록 수집.
          </p>
        </div>

        {/* Direct Upload Card */}
        <div
          onClick={() => setActiveService('upload')}
          className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 ${
            activeService === 'upload'
              ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-900 border border-slate-200">
              직접 업로드
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">직접 파일 등록</h3>
          <p className="text-xs text-slate-500 line-clamp-2">
            PPT, PDF, MD 회의록 및 핵심 소스 코드 직접 입력.
          </p>
        </div>
      </div>

      {/* Main Upload / Integration Details Form Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        {activeService === 'upload' && (
          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-slate-900" />
                  신규 산출물 / 코드 직접 수집 등록
                </h2>
                <p className="text-xs text-slate-500">프로젝트 관련 회의록, 아키텍처 명세, 트러블슈팅 코드를 등록하세요.</p>
              </div>

              <span className="text-xs text-slate-800 font-semibold bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                [{currentProject?.title ?? ""}] 선택됨
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">산출물 제목</label>
                <input
                  type="text"
                  required
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="예: Kafka Consumer Group Rebalance 방지 로직"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">산출물 유형</label>
                <select
                  value={fileType}
                  onChange={(e: any) => setFileType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="code">소스 코드 (Source Code)</option>
                  <option value="meeting_note">회의록 및 스크럼 (Meeting Note)</option>
                  <option value="document">기획 문서/PPT/PDF (Document)</option>
                  <option value="architecture">아키텍처 및 ERD 명세 (Architecture)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="예: Troubleshooting, Kafka, Spring Boot, DLQ"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">산출물 본문 / 회의록 / 코드 스니펫</label>
              <textarea
                required
                rows={6}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="코드 본문, Markdown 문서 내용 또는 회의록 원문을 입력해 주세요. AI가 이를 바탕으로 트러블슈팅과 포트폴리오를 자동 추출합니다."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
              />
            </div>

            {/* Ingestion Progress Bar */}
            {isUploading && (
              <div className="space-y-2 p-4 bg-slate-100 border border-slate-200 rounded-xl">
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>AI 파이프라인 분석 및 인덱싱 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-900 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>산출물 저장 및 AI 인덱싱 추가</span>
            </button>
          </form>
        )}

        {/* Active Service Connector Details */}
        {activeService === 'notion' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-slate-900" />
                  Notion Integration 연결 설정
                </h2>
                <p className="text-xs text-slate-500">
                  Notion 내부 통합 토큰(Internal Integration Secret)을 등록하여 노션 회의록과 문서 블록을 수집합니다.
                </p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {notionStatus.workspaceName}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span>등록된 Notion 토큰:</span>
                <span className="font-mono bg-slate-200/80 px-2.5 py-1 rounded text-slate-800 font-bold">
                  {notionStatus.tokenMasked}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveNotionToken} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900">신규 Notion API Integration Key 변경/등록</h3>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Notion Workspace 이름</label>
                <input
                  type="text"
                  value={notionWorkspaceInput}
                  onChange={(e) => setNotionWorkspaceInput(e.target.value)}
                  placeholder="예: 가천대학교 학술제 워크스페이스"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">Notion Secret Token (secret_...)</label>
                <input
                  type="password"
                  required
                  value={notionTokenInput}
                  onChange={(e) => setNotionTokenInput(e.target.value)}
                  placeholder="secret_notion_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingNotion}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                {isSavingNotion ? '토큰 저장 중...' : 'Notion 통합 토큰 저장'}
              </button>
            </form>

            {/*
              토큰만 저장하면 아무것도 수집되지 않는다. 무엇을 긁을지 소스로 등록해야
              동기화가 Notion을 쳐다본다 — 이 화면이 없어서 연동해도 자료가 안 들어왔다.
            */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs text-slate-700">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">수집 대상 페이지</h3>
                <p className="leading-relaxed text-slate-500">
                  페이지 주소를 넣으면 그 페이지만, 비워두고 등록하면 integration에 공유된 페이지 전체를 수집합니다.
                  어느 쪽이든 Notion에서 <strong>페이지 우상단 [...] → 연결(Connections)</strong>로 integration을 추가해야 읽을 수 있습니다.
                </p>
              </div>

              <form onSubmit={handleAddSource} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sourceRefInput}
                  onChange={(e) => setSourceRefInput(e.target.value)}
                  placeholder="https://www.notion.so/... (비우면 공유된 페이지 전체)"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={isSavingSource}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  {isSavingSource ? '등록 중...' : '수집 대상 등록'}
                </button>
              </form>

              {activeSources.length > 0 && (
                <div className="space-y-1.5">
                  {activeSources.map((src) => (
                    <div key={src.id} className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">NOTION</span>
                      <span className="text-slate-500 truncate flex-1">
                        {src.externalRef || '공유된 페이지 전체'}
                      </span>
                      <button
                        onClick={() => handleRemoveSource(src.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="수집 대상 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={
                          src.status === 'FAILED'
                            ? 'font-bold text-rose-600'
                            : src.status === 'DONE'
                            ? 'font-bold text-emerald-600'
                            : 'font-bold text-slate-500'
                        }
                        title={src.message || undefined}
                      >
                        {src.status}
                      </span>
                    </div>
                  ))}
                  {activeSources.some((src) => src.status === 'FAILED') && (
                    <p className="text-rose-600 pt-1 leading-relaxed">
                      {activeSources.find((src) => src.status === 'FAILED')?.message}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleTriggerAsyncSync}
                disabled={isSyncingAsync}
                className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-xs disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAsync ? 'animate-spin' : ''}`} />
                <span>소스 데이터 동기화 시작</span>
              </button>

              {isSyncingAsync && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span>소스 수집 파이프라인 진행 중</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">{syncMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeService !== 'upload' && activeService !== 'notion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {activeLabel} 연동 가이드 및 자동 동기화
              </h2>
              <span
                className={
                  activeConnected
                    ? 'px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1'
                    : 'px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full flex items-center gap-1'
                }
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activeConnected ? `${activeLabel} 연결됨` : `${activeLabel} 연결 필요`}
              </span>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                선택하신 <strong>{activeLabel}</strong> 수집기입니다.
                {activeSourceRef
                  ? ` 등록된 대상: ${activeSourceRef}`
                  : ` 이 프로젝트에 등록된 ${activeLabel} 대상이 없습니다. 프로젝트 생성 시 주소를 입력하면 수집 대상이 됩니다.`}
              </p>

              {/* 수집 대상 등록 — 소스가 하나도 없으면 동기화 자체가 400으로 막힌다. */}
              <form onSubmit={handleAddSource} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={sourceRefInput}
                  onChange={(e) => setSourceRefInput(e.target.value)}
                  placeholder={
                    activeService === 'github'
                      ? 'https://github.com/org/repo 또는 조직 주소(저장소별로 자동 분리)'
                      : 'Google Drive 폴더 ID'
                  }
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  disabled={isSavingSource || (!sourceRefInput.trim() && activeType !== 'NOTION')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  {isSavingSource ? '등록 중...' : '수집 대상 등록'}
                </button>
              </form>

              {/* 지금 보고 있는 수집기의 소스만 — 탭을 바꿔도 다른 소스가 남아 보이면 안 된다. */}
              {activeSources.length > 0 && (
                <div className="space-y-1.5">
                  {activeSources.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-800">{s.type}</span>
                      <span className="text-slate-500 truncate flex-1">{s.externalRef || '(전체)'}</span>
                      <button
                        onClick={() => handleRemoveSource(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="수집 대상 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={
                          s.status === 'FAILED'
                            ? 'font-bold text-rose-600'
                            : s.status === 'DONE'
                            ? 'font-bold text-emerald-600'
                            : 'font-bold text-slate-500'
                        }
                        title={s.message || undefined}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isSyncingAsync && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span>소스 수집 파이프라인 진행 중</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">{syncMessage}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleTriggerAsyncSync}
                  disabled={isSyncingAsync}
                  className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAsync ? 'animate-spin' : ''}`} />
                  <span>소스 데이터 동기화 시작</span>
                </button>
                <a
                  href={currentProject?.githubRepo || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white border border-slate-300 font-medium rounded-xl text-slate-700 flex items-center gap-1 hover:bg-slate-50"
                >
                  외부 저장소 바로가기 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collected Artifacts List */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              수집된 산출물 목록 (Backend Artifacts)
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                {filteredArtifacts.length}개
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              백엔드 파싱 엔진을 통해 저장된 <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">artifacts.content</code> 산출물입니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Backend Artifact Type Pills (COMMIT | CODE | DOC | MEETING) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              {(['ALL', 'COMMIT', 'CODE', 'DOC', 'MEETING'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setArtifactTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    artifactTypeFilter === t
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목/태그 검색..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredArtifacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              등록되거나 수집된 산출물이 없습니다.
            </div>
          ) : (
            filteredArtifacts.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 hover:bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        art.type === 'code'
                          ? 'bg-purple-100 text-purple-800'
                          : art.type === 'meeting_note'
                          ? 'bg-amber-100 text-amber-800'
                          : art.type === 'architecture'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {art.type === 'code' && <Code2 className="w-3.5 h-3.5" />}
                      {art.type === 'meeting_note' && <FileText className="w-3.5 h-3.5" />}
                      {art.type === 'architecture' && <Zap className="w-3.5 h-3.5" />}
                      {art.type}
                    </span>

                    <h3 className="text-sm font-bold text-slate-900">{art.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{art.author}</span>
                    <span>•</span>
                    <span>{art.timestamp}</span>
                    <button
                      onClick={() => onDeleteArtifact(art.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview text */}
                <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed">
                  {art.content}
                </pre>

                {/* Tags */}
                {art.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {art.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[10px] font-semibold rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
