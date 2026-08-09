/**
 * Spring Boot 백엔드 REST API 클라이언트.
 *
 * 실패는 삼키지 않고 ApiError로 던진다 — 호출부가 빈 결과와 장애를 구분할 수 있어야 한다.
 */
import type {
  ArtifactType,
  ArtifactView,
  IntegrationStatus,
  ProjectDetailView,
  ProjectSummaryView,
  SourceType,
  SourceView,
  SyncStatusView,
} from '../types';
import type { InterviewQuestionResponse, PortfolioReport, StarResponse } from './mappers';

const env = (import.meta as unknown as { env: Record<string, string> }).env ?? {};

// 빈 값이 기본 — /api 요청은 같은 오리진으로 나가고 vite dev proxy(로컬)나 vercel rewrite(배포)가 백엔드로 넘긴다.
const API_BASE_URL = env.VITE_API_BASE_URL || '';

// OAuth만은 프록시를 타면 안 된다. 인가 요청과 콜백이 다른 오리진에 떨어지면
// 백엔드 세션에서 authorization request를 못 찾는다 — 백엔드로 직접 보낸다.
const OAUTH_BASE_URL = env.VITE_OAUTH_BASE_URL || API_BASE_URL;

const ACCESS_TOKEN_KEY = 'career_arch_access_token';
const REFRESH_TOKEN_KEY = 'career_arch_refresh_token';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

/** 401을 만나면 refresh를 한 번만 시도한다. 동시에 여러 요청이 터져도 갱신은 한 번. */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        tokenStorage.clearTokens();
        return false;
      }
      const data = await res.json();
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      tokenStorage.clearTokens();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function send(path: string, options: RequestInit, retry = true): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = tokenStorage.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // FormData는 브라우저가 boundary를 붙여야 해서 Content-Type을 건드리면 안 된다.
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401 && retry && (await tryRefresh())) {
    return send(path, options, false);
  }
  return res;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await send(path, options);
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res));
  }
  // 204 No Content에 json 파싱을 걸면 터진다.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await res.json()) as T;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message || body.error || `요청 실패 (${res.status})`;
  } catch {
    return `요청 실패 (${res.status})`;
  }
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  jobTitle: string | null;
  bio: string | null;
  theme: string;
  techStack: string[];
}

export interface ChatView {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations: { artifactId: number; title: string | null; url: string | null; snippet: string }[];
  createdAt: string;
}

export const apiService = {
  auth: {
    async signup(payload: { email: string; password: string; name: string }) {
      const data = await request<TokenResponse>('/api/auth/signup', { method: 'POST', ...json(payload) });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data;
    },

    async login(payload: { email: string; password: string }) {
      const data = await request<TokenResponse>('/api/auth/login', { method: 'POST', ...json(payload) });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data;
    },

    me: () => request<MeResponse>('/api/auth/me'),

    /** null·undefined인 항목은 서버가 건드리지 않는다. */
    updateMe: (payload: {
      name?: string;
      jobTitle?: string;
      bio?: string;
      theme?: string;
      techStack?: string[];
    }) => request<MeResponse>('/api/auth/me', { method: 'PATCH', ...json(payload) }),

    /** 백엔드가 인가 요청 세션을 들고 있어야 해서 프록시를 우회한다. */
    startOAuth(provider: 'github' | 'google') {
      window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
    },

    /**
     * 로그인한 계정에 provider를 연결한다.
     *
     * 콜백에는 우리 JWT가 실리지 않아 백엔드는 provider 이메일로 계정을 찾는다. 가입 이메일과
     * GitHub 이메일이 다르면 같은 사람인데 계정이 하나 더 생긴다. 그래서 이동 전에
     * "이 계정에 붙여라"를 세션에 남긴다 — 세션 쿠키가 백엔드 도메인에 있어야 하므로
     * 프록시를 거치지 않고 직접 호출하고 쿠키를 함께 보낸다.
     */
    async linkProvider(provider: 'github' | 'google') {
      try {
        await fetch(`${OAUTH_BASE_URL}/api/auth/link-intent`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
        });
      } catch (err) {
        // 실패해도 로그인 자체는 되게 둔다 — 이메일이 같으면 어차피 같은 계정으로 붙는다.
        console.warn('계정 연결 표시에 실패했습니다. 이메일이 같으면 그대로 연결됩니다.', err);
      }
      window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
    },
  },

  projects: {
    list: () => request<ProjectSummaryView[]>('/api/projects'),

    create: (payload: {
      name: string;
      period?: string;
      members: number;
      techStack?: string[];
      description?: string;
      role?: string;
      category?: string;
      state?: 'ONGOING' | 'COMPLETED';
    }) => request<ProjectSummaryView>('/api/projects', { method: 'POST', ...json(payload) }),

    detail: (id: number) => request<ProjectDetailView>(`/api/projects/${id}`),

    remove: (id: number) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

    /** 조직 주소를 넣으면 저장소별로 펼쳐져 여러 건이 돌아온다. */
    addSource: (projectId: number, payload: { type: SourceType; externalRef?: string | null }) =>
      request<SourceView[]>(`/api/projects/${projectId}/sources`, { method: 'POST', ...json(payload) }),

    removeSource: (projectId: number, sourceId: number) =>
      request<void>(`/api/projects/${projectId}/sources/${sourceId}`, { method: 'DELETE' }),

    uploadFiles(projectId: number, files: File[]) {
      const form = new FormData();
      files.forEach((f) => form.append('files', f));
      return request<ArtifactView[]>(`/api/projects/${projectId}/files`, { method: 'POST', body: form });
    },

    startSync: (projectId: number) =>
      request<SyncStatusView>(`/api/projects/${projectId}/sync`, { method: 'POST' }),

    syncStatus: (projectId: number) => request<SyncStatusView>(`/api/projects/${projectId}/sync`),

    artifacts: (projectId: number, type?: ArtifactType) =>
      request<ArtifactView[]>(`/api/projects/${projectId}/artifacts${type ? `?type=${type}` : ''}`),

    timeline: (projectId: number) => request<ArtifactView[]>(`/api/projects/${projectId}/timeline`),

    chatHistory: (projectId: number) => request<ChatView[]>(`/api/projects/${projectId}/chat`),

    ask: (projectId: number, question: string) =>
      request<ChatView>(`/api/projects/${projectId}/chat`, { method: 'POST', ...json({ question }) }),

    summary: (projectId: number, days: number) =>
      request<{ summary: string }>(`/api/projects/${projectId}/summary?days=${days}`),

    interview: (projectId: number, question: string) =>
      request<{ answer: string; citations: ChatView['citations'] }>(
        `/api/projects/${projectId}/interview`,
        { method: 'POST', ...json({ question }) }
      ),

    addArtifact: (
      projectId: number,
      payload: { type: ArtifactType; title: string; content: string; tags?: string[] }
    ) => request<ArtifactView>(`/api/projects/${projectId}/artifacts`, { method: 'POST', ...json(payload) }),

    removeArtifact: (projectId: number, artifactId: number) =>
      request<void>(`/api/projects/${projectId}/artifacts/${artifactId}`, { method: 'DELETE' }),

    portfolio: (projectId: number) =>
      request<PortfolioReport>(`/api/projects/${projectId}/portfolio`, { method: 'POST' }),

    /** 저장해 둔 리포트. 아직 생성한 적 없으면 204라 undefined가 돌아온다. */
    savedPortfolio: (projectId: number) =>
      request<PortfolioReport | undefined>(`/api/projects/${projectId}/portfolio`),

    careerStar: (projectId: number, payload: { jobRole: string; question: string }) =>
      request<StarResponse>(`/api/projects/${projectId}/career/star`, { method: 'POST', ...json(payload) }),

    interviewQuestions: (projectId: number, payload: { jobRole: string; questionCount?: number }) =>
      request<{ questions: InterviewQuestionResponse[] }>(
        `/api/projects/${projectId}/career/interview-questions`,
        { method: 'POST', ...json(payload) }
      ),
  },

  integrations: {
    status: () => request<IntegrationStatus>('/api/integrations'),

    setNotionToken: (token: string) =>
      request<void>('/api/integrations/notion', { method: 'PUT', ...json({ token }) }),

    disconnect: (provider: 'github' | 'google' | 'notion') =>
      request<void>(`/api/integrations/${provider}`, { method: 'DELETE' }),
  },
};
