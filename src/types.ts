export interface UserNotifications {
  emailAlerts: boolean;
  commitSyncAlerts: boolean;
  weeklyAiReport: boolean;
  marketing: boolean;
}

/**
 * `/api/auth/me`가 주는 건 id·email·name 뿐이다.
 * 아래 선택 필드는 아직 백엔드에 저장할 컬럼이 없어 브라우저 세션에만 남는다.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  googleAvatar?: string;
  githubAvatar?: string;
  provider?: 'google' | 'github' | 'email';
  jobTitle?: string;
  bio?: string;
  techStack?: string[];
  theme?: 'light' | 'dark' | 'system';
  /** GET /api/integrations 결과를 옮겨 담는다. 화면 표시용이라 없을 수 있다. */
  connectedServices?: {
    github: boolean;
    googleDrive: boolean;
    notion: boolean;
  };
  notifications?: UserNotifications;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: '진행 중' | '완료';
  techStack: string[];
  teamSize: string;
  role: string;
  period: string;
  progress: number;
  githubRepo?: string;
  notionUrl?: string;
  googleDriveUrl?: string;
  filesCount: number;
  commitsCount: number;
  lastUpdated: string;
  createdAt: string;
  summaryQuote?: string;
}

export interface ProjectArtifact {
  id: string;
  projectId: string;
  title: string;
  type: 'code' | 'document' | 'meeting_note' | 'commit' | 'architecture' | 'file';
  content: string;
  language?: string;
  fileSize?: string;
  author: string;
  timestamp: string;
  tags: string[];
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  title: string;
  description: string;
  type: 'commit' | 'milestone' | 'troubleshooting' | 'meeting' | 'file_upload';
  author: string;
  commitHash?: string;
  impactBadge?: string;
}

/** category는 AI 서버가 분류해서 준다(FRONTEND/BACKEND/…). 화면은 문자열 그대로 표시만 한다. */
export interface TechStackItem {
  techName: string;
  category: string;
  reasonForAdoption: string;
}

export interface TroubleshootingItem {
  id: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  tags: string[];
}

export interface KeyContributionItem {
  id: string;
  title: string;
  description: string;
  impactMetrics: string;
}

export interface PortfolioData {
  projectId: string;
  updatedAt: string;
  executiveSummary: {
    servicePurpose: string;
    targetAudience: string;
    period: string;
    teamSize: string;
    myPosition: string;
    oneLineSummary: string;
  };
  techStackAndArchitecture: {
    techList: TechStackItem[];
    systemArchitectureDesc: string;
    erdSummary: string;
  };
  keyContributions: KeyContributionItem[];
  troubleshootingList: TroubleshootingItem[];
  retrospective: {
    technicalGrowth: string;
    collaborationInsights: string;
    futureImprovements: string;
  };
}

export interface BackendCitation {
  artifactId: string;
  title: string;
  url?: string;
  snippet: string;
}

// ── 백엔드(Spring) 응답 스키마 그대로. 화면용 타입과 섞지 않는다. ──────────────

export type SourceType = 'GITHUB' | 'GDRIVE' | 'NOTION' | 'UPLOAD';
export type SourceStatus = 'PENDING' | 'SYNCING' | 'DONE' | 'FAILED';
export type ProjectStatus = 'PENDING' | 'ANALYZING' | 'DONE';
export type ArtifactType = 'COMMIT' | 'CODE' | 'DOC' | 'MEETING';

export interface SourceView {
  id: number;
  type: SourceType;
  externalRef: string | null;
  status: SourceStatus;
  message: string | null;
  lastSyncedAt: string | null;
}

export interface ProjectSummaryView {
  id: number;
  name: string;
  /** 수집 파이프라인 상태. */
  status: ProjectStatus;
  /** 사용자가 고른 진행/완료 구분. */
  state: 'ONGOING' | 'COMPLETED';
  description: string | null;
  role: string | null;
  category: string | null;
  files: number;
  commits: number;
  createdAt: string;
  lastSyncedAt: string | null;
  sources: SourceType[];
  techStack: string[];
  period: string | null;
  members: number;
}

export interface ProjectDetailView {
  project: ProjectSummaryView;
  sources: SourceView[];
}

export interface SyncStatusView {
  status: ProjectStatus;
  sources: SourceView[];
}

export interface ArtifactView {
  id: number;
  type: ArtifactType;
  /** 소스 내 고유 키. 커밋이면 sha, PR이면 pr-{번호}. */
  externalId: string;
  title: string;
  path: string | null;
  content: string | null;
  author: string | null;
  occurredAt: string | null;
  url: string | null;
  /** 직접 등록한 산출물에만 붙는다. */
  tags: string[];
}

/** GET /api/integrations — provider 이름을 소문자로 키에 담아 준다. */
export interface IntegrationStatus {
  github: boolean;
  google: boolean;
  notion: boolean;
}

export interface ProjectSummaryResponse {
  summary: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  references?: string[];
  citations?: BackendCitation[];
  isStreaming?: boolean;
}

// AI Server (FastAPI) OpenAPI 3.1.0 Contract Schema Types
export type AIChunkType = 'COMMIT' | 'CODE' | 'DOC' | 'MEETING';

export interface AIChunk {
  artifactId: number;
  type: AIChunkType;
  title: string;
  path?: string | null;
  url?: string | null;
  author?: string | null;
  occurredAt?: string | null;
  seq?: number;
  text: string;
}

export interface AIIndexRequest {
  projectId: number;
  chunks: AIChunk[];
}

export interface AIIndexResponse {
  indexed: number;
  techStack: string[];
}

export interface AIQuestionRequest {
  projectId: number;
  question: string;
}

export interface AICitation {
  artifactId: number;
  title: string;
  url?: string | null;
  snippet: string;
}

export interface AIChatResponse {
  answer: string;
  citations: AICitation[];
}

export interface AISummaryRequest {
  projectId: number;
  since: string; // ISO date-time
}

export interface AISummaryResponse {
  summary: string;
}

export interface CoverLetterQA {
  id: string;
  question: string;
  jobTarget: string;
  selectedProjectId: string;
  projectTitle: string;
  generatedAnswer: string;
  starBreakdown?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  createdAt: string;
}

export interface InterviewPrepItem {
  id: string;
  projectId: string;
  /** AI가 정하는 분류라 값을 고정하지 않는다. */
  category: string;
  question: string;
  sampleAnswer: string;
  keyCheckingPoints: string[];
  followUpQuestions: string[];
}
