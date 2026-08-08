/**
 * 백엔드 응답 → 화면이 쓰는 타입 변환.
 *
 * 화면 컴포넌트는 건드리지 않고 여기서만 맞춘다. 백엔드 스키마가 바뀌면 이 파일만 고치면 된다.
 */
import type {
  ArtifactView,
  CoverLetterQA,
  InterviewPrepItem,
  PortfolioData,
  Project,
  ProjectArtifact,
  ProjectSummaryView,
  SourceView,
  TimelineEvent,
} from '../types';

/** 수집 상태를 진행률로 환산한다. 별도 컬럼을 두는 대신 상태에서 끌어낸다. */
const PROGRESS_BY_STATUS = { PENDING: 10, ANALYZING: 55, DONE: 100 } as const;

const ARTIFACT_TYPE: Record<ArtifactView['type'], ProjectArtifact['type']> = {
  COMMIT: 'commit',
  CODE: 'code',
  DOC: 'document',
  MEETING: 'meeting_note',
};

const TIMELINE_TYPE: Record<ArtifactView['type'], TimelineEvent['type']> = {
  COMMIT: 'commit',
  CODE: 'file_upload',
  DOC: 'file_upload',
  MEETING: 'meeting',
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(0, 10);
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
}

export function toProject(v: ProjectSummaryView, sources: SourceView[] = []): Project {
  const refOf = (type: SourceView['type']) =>
    sources.find((s) => s.type === type)?.externalRef ?? undefined;

  return {
    id: String(v.id),
    title: v.name,
    description: v.description ?? '',
    category: v.category ?? '미분류',
    status: v.state === 'COMPLETED' ? '완료' : '진행 중',
    techStack: v.techStack ?? [],
    teamSize: `${v.members}인 팀`,
    role: v.role ?? '',
    period: v.period ?? '',
    progress: PROGRESS_BY_STATUS[v.status] ?? 0,
    githubRepo: refOf('GITHUB'),
    notionUrl: refOf('NOTION'),
    googleDriveUrl: refOf('GDRIVE'),
    filesCount: v.files,
    commitsCount: v.commits,
    lastUpdated: formatDate(v.lastSyncedAt ?? v.createdAt),
    createdAt: formatDate(v.createdAt),
  };
}

export function toArtifact(v: ArtifactView, projectId: string): ProjectArtifact {
  return {
    id: String(v.id),
    projectId,
    title: v.title,
    type: ARTIFACT_TYPE[v.type],
    content: v.content ?? '',
    author: v.author ?? '-',
    timestamp: formatDateTime(v.occurredAt),
    tags: v.tags ?? [],
  };
}

export function toTimelineEvent(v: ArtifactView, projectId: string, projectTitle: string): TimelineEvent {
  const body = (v.content ?? '').trim().replace(/\s+/g, ' ');
  return {
    id: String(v.id),
    projectId,
    projectTitle,
    date: formatDate(v.occurredAt),
    title: v.title,
    description: body.length > 120 ? `${body.slice(0, 120)}…` : body,
    type: TIMELINE_TYPE[v.type],
    author: v.author ?? '-',
    // 커밋 sha는 앞 7자만 보여주는 게 관례다. PR은 pr-12 형태라 그대로 둔다.
    commitHash: v.type === 'COMMIT' ? v.externalId.slice(0, 7) : undefined,
  };
}

// ── AI 생성물 ──────────────────────────────────────────────────────────────

export interface PortfolioReport {
  projectId: number;
  projectName: string;
  generatedAt: string;
  oneLineSummary: string;
  executiveSummary: {
    servicePurpose: string;
    targetUsers: string;
    period: string;
    teamSize: string;
    role: string;
  };
  techStack: { name: string; category: string; reason: string }[];
  systemArchitecture: string;
  dataPipeline: string;
  contributions: { title: string; description: string; metrics: string[] }[];
  troubleshooting: { title: string; tags: string[]; situation: string; action: string; result: string }[];
  retrospective: { technicalGrowth: string; collaboration: string; futureRoadmap: string };
  missingEvidence: string[];
}

export function toPortfolioData(r: PortfolioReport, projectId: string): PortfolioData {
  return {
    projectId,
    updatedAt: formatDateTime(r.generatedAt),
    executiveSummary: {
      servicePurpose: r.executiveSummary.servicePurpose,
      targetAudience: r.executiveSummary.targetUsers,
      period: r.executiveSummary.period,
      teamSize: r.executiveSummary.teamSize,
      myPosition: r.executiveSummary.role,
      oneLineSummary: r.oneLineSummary,
    },
    techStackAndArchitecture: {
      techList: r.techStack.map((t) => ({
        techName: t.name,
        category: t.category,
        reasonForAdoption: t.reason,
      })),
      systemArchitectureDesc: r.systemArchitecture,
      erdSummary: r.dataPipeline,
    },
    keyContributions: r.contributions.map((c, i) => ({
      id: `kc-${i}`,
      title: c.title,
      description: c.description,
      impactMetrics: c.metrics.join(' · '),
    })),
    troubleshootingList: r.troubleshooting.map((t, i) => ({
      id: `ts-${i}`,
      title: t.title,
      situation: t.situation,
      action: t.action,
      result: t.result,
      tags: t.tags,
    })),
    retrospective: {
      technicalGrowth: r.retrospective.technicalGrowth,
      collaborationInsights: r.retrospective.collaboration,
      futureImprovements: r.retrospective.futureRoadmap,
    },
  };
}

export interface StarResponse {
  jobRole: string;
  question: string;
  star: { situation: string; task: string; action: string; result: string };
  finalAnswer: string;
  missingEvidence: string[];
}

export function toCoverLetter(r: StarResponse, projectId: string, projectTitle: string): CoverLetterQA {
  return {
    id: `cl-${projectId}-${r.question.length}-${r.finalAnswer.length}`,
    question: r.question,
    jobTarget: r.jobRole,
    selectedProjectId: projectId,
    projectTitle,
    generatedAnswer: r.finalAnswer,
    starBreakdown: r.star,
    createdAt: new Date().toLocaleDateString('ko-KR'),
  };
}

export interface InterviewQuestionResponse {
  category: string;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  question: string;
  modelAnswer: string;
  checkpoints: string[];
  followUps: { question: string; recommendedAnswer: string }[];
}

export function toInterviewItem(
  q: InterviewQuestionResponse,
  projectId: string,
  index: number
): InterviewPrepItem {
  return {
    id: `int-${projectId}-${index}`,
    projectId,
    category: q.category,
    question: q.question,
    sampleAnswer: q.modelAnswer,
    keyCheckingPoints: q.checkpoints,
    // 화면은 문자열 목록만 받는다 — 권장 답변을 같은 줄에 붙여 정보를 잃지 않게 한다.
    followUpQuestions: q.followUps.map((f) => `${f.question} → ${f.recommendedAnswer}`),
  };
}
