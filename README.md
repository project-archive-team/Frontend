# 🚀 Project Archive Agent - Frontend

> **개발자를 위한 프로젝트 산출물 통합 아카이빙 및 AI 맞춤형 포트폴리오 자동 구조화 플랫폼 (프론트엔드 클라이언트)**

## 📖 서비스 소개
**Project Archive Agent**는 GitHub, Google Drive, Notion 등 여러 곳에 흩어진 프로젝트 산출물(코드, 문서, 회의록)을 한곳으로 수집하고, 자연어 AI 기술을 통해 맞춤형 포트폴리오와 면접 대비 자료를 자동 생성해 주는 서비스입니다. 

본 저장소는 사용자와 직접 상호작용하는 **React 기반의 프론트엔드 웹 애플리케이션**입니다. 메인 백엔드(Spring Boot) 및 AI 서버(FastAPI)와 연동하여 복잡한 데이터 파이프라인과 RAG 기반 챗봇을 직관적이고 매끄러운 UI로 제공합니다.

## ✨ 주요 기능 (Key Features)
*   **📊 통합 대시보드 (Dashboard)**
    *   프로젝트 진행률, 수집된 산출물 통계, 커밋 수 요약
    *   기간별(7/14/30일) 커밋 및 회의록 기반 AI 요약 리포트 제공
    *   주요 트러블슈팅 및 마일스톤 활동 타임라인 시각화
*   **🔗 멀티 소스 연결기 (Source Connector)**
    *   GitHub, Google Drive, Notion OAuth 2.0 및 API 연동 UI
    *   산출물(PDF, PPTX, MD, TXT, 코드 스니펫) 직접 업로드 및 실시간 수집(Sync) 폴링 상태 표시
*   **📝 AI 포트폴리오 뷰어 (Archive Viewer)**
    *   수집된 산출물을 기반으로 5대 핵심 항목(한 줄 요약, 아키텍처, 핵심 기여, 트러블슈팅(STAR), 회고) 자동 구조화
    *   작성된 포트폴리오 Markdown 복사 및 PDF 인쇄 지원
    *   코드 및 문서 원본 확인을 위한 사이드바이사이드 뷰어 제공
*   **🎯 취업 지원 도구 (Career Tools)**
    *   자소서 문항 및 지원 직무 맞춤형 STAR 기법 답변 자동 생성
    *   프로젝트 아키텍처 기반 실전 기술 면접 예상 질문 및 꼬리 질문(Follow-up) 제안
*   **💬 실시간 AI 챗봇 (Floating RAG Chatbot)**
    *   아카이빙된 코드를 바탕으로 기술적 의사결정 과정을 묻고 답할 수 있는 챗봇
    *   SSE(Server-Sent Events) 스트리밍을 통한 실시간 답변 렌더링
*   **⚙️ 마이페이지 및 테마 설정**
    *   Light / Dark / System 디스플레이 테마 완벽 지원
    *   개발 직무 설정 및 기술 스택 태그 관리

## 🛠 기술 스택 (Tech Stack)
*   **Framework & Language:** React 19, TypeScript, Vite
*   **Styling & UI:** Tailwind CSS v4, Lucide React (Icons)
*   **Animation:** Motion
*   **Architecture:** Component-based Architecture, Custom Hooks

## 🔄 시스템 아키텍처 및 통신 (Integration)
프론트엔드는 통합 인증 및 데이터 제공을 담당하는 **Spring Boot 백엔드**와 통신합니다.

*   **인증 체계 (JWT & OAuth2):** 
    *   일반 로그인 및 소셜 로그인(GitHub, Google) 지원
    *   OAuth 로그인은 백엔드의 `/oauth2/authorization/{provider}`로 리다이렉트 처리
    *   로그인 성공 시 전달받은 Access Token을 브라우저 `localStorage`에 저장하여 Bearer Auth로 API 호출 (`src/services/api.ts` 참조)
*   **비동기 작업 폴링:** 파일 수집 및 AI 분석 등 긴 작업은 HTTP 202 Accepted 처리 후 `/api/projects/{id}/sync` 엔드포인트를 폴링하여 UI에 진행률 반영
*   **챗봇 스트리밍:** AI 서버(FastAPI)에서 생성된 RAG 답변을 백엔드를 거쳐 SSE 형태로 받아와 실시간 타이핑 효과 구현

## 🚀 시작하기 (Getting Started)

### 1. Prerequisites
*   Node.js (v18 이상 권장)
*   npm 또는 yarn

### 2. Installation
저장소를 클론하고 의존성 패키지를 설치합니다.
```bash
git clone https://github.com/Team-Archive/project-archive-frontend.git
cd project-archive-frontend
npm install
```

### 3. Environment Variables
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 Spring Boot 백엔드 서버의 주소를 기입합니다.
```env
# 로컬 개발 시 Spring Boot 기본 포트(8080) 지정
VITE_API_BASE_URL=http://localhost:8080
```

### 4. Run Development Server
개발 서버를 실행합니다.
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 으로 접속하여 앱을 확인할 수 있습니다.

## 📁 주요 디렉토리 구조 (Directory Structure)
```text
src/
├── components/       # UI 컴포넌트 모음 (Dashboard, Connectors, Chatbot 등)
├── services/         # API 통신 모듈 (api.ts - 백엔드 REST API 명세 연동)
├── types/            # TypeScript 인터페이스 및 타입 정의
├── data/             # 로컬 개발용 Initial Data Mocking
├── main.tsx          # React 앱 엔트리 포인트
└── index.css         # Tailwind CSS 글로벌 스타일
