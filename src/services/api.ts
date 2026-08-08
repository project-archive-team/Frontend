/**
 * Spring Boot 백엔드 REST API 통신 서비스
 * 
 * Authorization: Bearer <accessToken>
 *
 * 엔드포인트 규격:
 * POST   /api/auth/signup, /login, /refresh
 * GET    /api/auth/me
 * GET    /oauth2/authorization/{github|google}
 * GET/POST /api/projects
 * GET/DELETE /api/projects/{id}
 * POST/DELETE /api/projects/{id}/sources[/{sourceId}]
 * POST   /api/projects/{id}/files
 * POST   /api/projects/{id}/sync (비동기 202)
 * GET    /api/projects/{id}/sync
 * GET    /api/projects/{id}/artifacts?type=
 * GET    /api/projects/{id}/timeline
 * GET/POST /api/projects/{id}/chat
 * GET    /api/projects/{id}/summary?days=7
 * POST   /api/projects/{id}/interview
 * GET    /api/integrations
 * PUT    /api/integrations/notion
 */

const env = (import.meta as unknown as { env: Record<string, string> }).env ?? {};

// 빈 값이 기본 — /api 요청은 같은 오리진으로 나가고 vite dev proxy(로컬)나 vercel rewrite(배포)가 EC2로 넘긴다.
const API_BASE_URL = env.VITE_API_BASE_URL || '';

// OAuth만은 프록시를 타면 안 된다. 인가 요청과 콜백이 다른 오리진에 떨어지면
// 백엔드 세션에서 authorization request를 못 찾는다 — 백엔드로 직접 보낸다.
const OAUTH_BASE_URL = env.VITE_OAUTH_BASE_URL || API_BASE_URL;

// Access & Refresh Token Management
const ACCESS_TOKEN_KEY = 'career_arch_access_token';
const REFRESH_TOKEN_KEY = 'career_arch_refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Generic Fetch Wrapper with Bearer Auth Header
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = tokenStorage.getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData as browser sets boundary automatically
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, try refresh token if available
  if (response.status === 401 && tokenStorage.getRefreshToken()) {
    const refreshed = await apiService.auth.refresh();
    if (refreshed && refreshed.accessToken) {
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
      return await fetch(fullUrl, { ...options, headers });
    }
  }

  return response;
}

export const apiService = {
  // 1. Auth API (/api/auth)
  auth: {
    async signup(payload: { email: string; password?: string; name: string }) {
      try {
        const res = await fetchWithAuth('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Signup failed (${res.status})`);
        const data = await res.json();
        if (data.accessToken) {
          tokenStorage.setTokens(data.accessToken, data.refreshToken);
        }
        return { ...data, user: await apiService.auth.me() };
      } catch (err) {
        console.warn('[API Auth] signup fallback/error:', err);
        return null;
      }
    },

    async login(payload: { email: string; password?: string }) {
      try {
        const res = await fetchWithAuth('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Login failed (${res.status})`);
        const data = await res.json();
        if (data.accessToken) {
          tokenStorage.setTokens(data.accessToken, data.refreshToken);
        }
        return { ...data, user: await apiService.auth.me() };
      } catch (err) {
        console.warn('[API Auth] login fallback/error:', err);
        return null;
      }
    },

    async refresh() {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          tokenStorage.clearTokens();
          return null;
        }
        const data = await res.json();
        if (data.accessToken) {
          tokenStorage.setTokens(data.accessToken, data.refreshToken);
        }
        return data;
      } catch (err) {
        console.warn('[API Auth] refresh error:', err);
        tokenStorage.clearTokens();
        return null;
      }
    },

    async me() {
      try {
        const res = await fetchWithAuth('/api/auth/me', { method: 'GET' });
        if (!res.ok) throw new Error(`Fetch user failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Auth] me fallback/error:', err);
        return null;
      }
    },

    /**
     * OAuth2 Authorization Start Endpoint
     * GET /oauth2/authorization/{provider} (github|google)
     */
    startOAuth(provider: 'github' | 'google') {
      const url = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
      window.location.href = url;
    },
  },

  // 2. Projects API (/api/projects)
  projects: {
    async list() {
      try {
        const res = await fetchWithAuth('/api/projects', { method: 'GET' });
        if (!res.ok) throw new Error(`Get projects failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Projects] list error:', err);
        return null;
      }
    },

    async create(payload: {
      name: string;
      period?: string;
      members: number;
      techStack?: string[];
    }) {
      try {
        const res = await fetchWithAuth('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create project failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Projects] create error:', err);
        return null;
      }
    },

    async getDetail(id: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${id}`, { method: 'GET' });
        if (!res.ok) throw new Error(`Get project detail failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Projects] getDetail error:', err);
        return null;
      }
    },

    async delete(id: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Delete project failed (${res.status})`);
        return true;
      } catch (err) {
        console.warn('[API Projects] delete error:', err);
        return null;
      }
    },

    // Sources (/api/projects/{id}/sources)
    async addSource(projectId: string, payload: { type: 'GITHUB' | 'GDRIVE' | 'NOTION' | 'UPLOAD'; externalRef?: string }) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/sources`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Add source failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Sources] addSource error:', err);
        return null;
      }
    },

    async removeSource(projectId: string, sourceId: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/sources/${sourceId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Remove source failed (${res.status})`);
        return true;
      } catch (err) {
        console.warn('[API Sources] removeSource error:', err);
        return null;
      }
    },

    // File Upload (/api/projects/{id}/files) - supports pdf, pptx, md, txt
    async uploadFiles(projectId: string, files: File[]) {
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const res = await fetchWithAuth(`/api/projects/${projectId}/files`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload files failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Files] uploadFiles error:', err);
        return null;
      }
    },

    // Sync Collection (/api/projects/{id}/sync) - Async (202) & Polling
    async startSync(projectId: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/sync`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(`Start sync failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Sync] startSync error:', err);
        return null;
      }
    },

    async getSyncStatus(projectId: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/sync`, { method: 'GET' });
        if (!res.ok) throw new Error(`Get sync status failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Sync] getSyncStatus error:', err);
        return null;
      }
    },

    // Artifacts (/api/projects/{id}/artifacts?type=)
    async getArtifacts(projectId: string, type?: string) {
      try {
        const query = type ? `?type=${encodeURIComponent(type)}` : '';
        const res = await fetchWithAuth(`/api/projects/${projectId}/artifacts${query}`, {
          method: 'GET',
        });
        if (!res.ok) throw new Error(`Get artifacts failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Artifacts] getArtifacts error:', err);
        return null;
      }
    },

    // Timeline (/api/projects/{id}/timeline)
    async getTimeline(projectId: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/timeline`, { method: 'GET' });
        if (!res.ok) throw new Error(`Get timeline failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Timeline] getTimeline error:', err);
        return null;
      }
    },

    // RAG Q&A Chat (/api/projects/{id}/chat)
    async getChatHistory(projectId: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/chat`, { method: 'GET' });
        if (!res.ok) throw new Error(`Get chat history failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Chat] getChatHistory error:', err);
        return null;
      }
    },

    async sendChatMessage(projectId: string, question: string) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/chat`, {
          method: 'POST',
          body: JSON.stringify({ question }),
        });
        if (!res.ok) throw new Error(`Send chat message failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Chat] sendChatMessage error:', err);
        return null;
      }
    },

    // Period Activity Summary (/api/projects/{id}/summary?days=7)
    async getSummary(projectId: string, days: number = 7) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/summary?days=${days}`, {
          method: 'GET',
        });
        if (!res.ok) throw new Error(`Get summary failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Summary] getSummary error:', err);
        return null;
      }
    },

    // Cover Letter & Interview Draft Generation (/api/projects/{id}/interview)
    async generateInterviewOrCoverLetter(projectId: string, payload: { question: string }) {
      try {
        const res = await fetchWithAuth(`/api/projects/${projectId}/interview`, {
          method: 'POST',
          body: JSON.stringify({ question: payload.question }),
        });
        if (!res.ok) throw new Error(`Generate draft failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Interview] generate error:', err);
        return null;
      }
    },
  },

  // 3. Integrations API (/api/integrations)
  integrations: {
    async getStatus() {
      try {
        const res = await fetchWithAuth('/api/integrations', { method: 'GET' });
        if (!res.ok) throw new Error(`Get integration status failed (${res.status})`);
        return await res.json();
      } catch (err) {
        console.warn('[API Integrations] getStatus error:', err);
        return null;
      }
    },

    async setNotionToken(token: string) {
      try {
        const res = await fetchWithAuth('/api/integrations/notion', {
          method: 'PUT',
          body: JSON.stringify({ token }),
        });
        if (!res.ok) throw new Error(`Set notion token failed (${res.status})`);
        return true;
      } catch (err) {
        console.warn('[API Integrations] setNotionToken error:', err);
        return null;
      }
    },
  },
};
