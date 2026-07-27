export interface BillingRecord {
  id: string;
  date: string;
  planName: string;
  amount: string;
  paymentMethod: string;
  status: '결제 완료' | '환불됨' | '처리 중';
  receiptUrl?: string;
}

export interface UserSubscription {
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'canceled' | 'trial';
  nextBillingDate: string;
  amount: string;
  paymentMethod: string;
  billingHistory: BillingRecord[];
}

export interface UserNotifications {
  emailAlerts: boolean;
  commitSyncAlerts: boolean;
  weeklyAiReport: boolean;
  marketing: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  googleAvatar?: string;
  githubAvatar?: string;
  provider: 'google' | 'github' | 'email';
  jobTitle?: string;
  bio?: string;
  techStack?: string[];
  theme?: 'light' | 'dark' | 'system';
  connectedServices: {
    github: boolean;
    googleDrive: boolean;
    notion: boolean;
  };
  connectedServicesLastSynced?: {
    github?: string;
    googleDrive?: string;
    notion?: string;
  };
  subscription?: UserSubscription;
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

export interface TechStackItem {
  techName: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'AI/ML' | 'Architecture';
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

export interface SyncSourceStatus {
  sourceId: string;
  type: 'GITHUB' | 'GOOGLE_DRIVE' | 'NOTION';
  status: 'SUCCESS' | 'FAILED' | 'SYNCING';
  itemSynced: number;
}

export interface SyncStatusResponse {
  projectId: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  progress: number;
  sources: SyncSourceStatus[];
  lastSyncedAt: string;
}

export interface NotionIntegrationConfig {
  connected: boolean;
  workspaceName: string;
  tokenMasked: string;
  lastSyncedAt: string;
}

export interface ProjectSummaryResponse {
  success: boolean;
  projectId: string;
  days: number;
  summary: string;
  updatedAt: string;
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
  starBreakdown: {
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
  category: '건축/아키텍처' | '트러블슈팅' | '기술적 의사결정' | 'CS/인프라';
  question: string;
  sampleAnswer: string;
  keyCheckingPoints: string[];
  followUpQuestions: string[];
}
