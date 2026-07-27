import { Project, ProjectArtifact, TimelineEvent, PortfolioData, InterviewPrepItem, CoverLetterQA } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'AI 기반 프로젝트 검색 및 아카이빙 플랫폼',
    description: '자연어로 흩어진 개발 산출물(코드, 문서, 회의록)을 임베딩하고 검색하며 AI 포트폴리오를 자동 설계하는 올인원 플랫폼',
    category: 'AI / Full Stack',
    status: '완료',
    techStack: ['React', 'TypeScript', 'FastAPI', 'pgvector', 'PostgreSQL', 'Docker', 'Gemini 3.6 Flash'],
    teamSize: '5인 팀',
    role: '백엔드 리드 & AI 파이프라인 설계',
    period: '2025.09 ~ 2025.12 (4개월)',
    progress: 100,
    githubRepo: 'https://github.com/archive-master/ai-portfolio-hub',
    notionUrl: 'https://notion.so/archive-master/ai-docs',
    googleDriveUrl: 'https://drive.google.com/drive/folders/ai-portfolio-assets',
    filesCount: 18,
    commitsCount: 142,
    lastUpdated: '2025-12-20',
    createdAt: '2025-09-01',
    summaryQuote: '흩어진 프로젝트 산출물을 자연어 AI 기술로 자동 정제하여 개발자 포트폴리오 작성을 80% 단축한 프로젝트'
  },
  {
    id: 'proj-2',
    title: '실시간 분산 알림 및 대용량 이벤트 스트리밍 시스템',
    description: 'Kafka 및 Redis Pub/Sub을 활용하여 분당 50,000건 이상의 이벤트를 지연 없이 처리하는 분산 메시지 알림 플랫폼',
    category: 'Backend / Distributed System',
    status: '진행 중',
    techStack: ['Spring Boot', 'Apache Kafka', 'Redis', 'WebSockets', 'Next.js', 'Kubernetes'],
    teamSize: '4인 팀',
    role: '분산 아키텍처 및 메시지 큐 담당',
    period: '2026.01 ~ 진행 중',
    progress: 75,
    githubRepo: 'https://github.com/archive-master/distributed-event-notify',
    filesCount: 12,
    commitsCount: 88,
    lastUpdated: '2026-07-15',
    createdAt: '2026-01-10',
    summaryQuote: '대규모 사용자 액션을 분산 알림으로 즉각 전송하기 위해 Kafka Partition Tuning 및 Dead Letter Queue를 적용한 서버 백엔드'
  }
];

export const INITIAL_ARTIFACTS: ProjectArtifact[] = [
  {
    id: 'art-1',
    projectId: 'proj-1',
    title: 'pgvector 및 Hybrid Search 쿼리 최적화 코드',
    type: 'code',
    language: 'python',
    content: `async function performHybridSearch(queryEmbedding: number[], rawText: string, topK = 10) {
  // Vector Similarity + Full-text Keyword BM25 Hybrid Ranker
  const sqlQuery = \`
    WITH vector_matches AS (
      SELECT id, title, content, 1 - (embedding <=> $1::vector) AS vector_score
      FROM project_documents
      ORDER BY embedding <=> $1::vector
      LIMIT 30
    ),
    text_matches AS (
      SELECT id, ts_rank_cd(to_tsvector('korean', content), plainto_tsquery('korean', $2)) AS text_score
      FROM project_documents
      WHERE to_tsvector('korean', content) @@ plainto_tsquery('korean', $2)
    )
    SELECT v.id, v.title, v.content,
           (COALESCE(v.vector_score, 0) * 0.7 + COALESCE(t.text_score, 0) * 0.3) AS final_score
    FROM vector_matches v
    LEFT JOIN text_matches t ON v.id = t.id
    ORDER BY final_score DESC
    LIMIT $3;
  \`;
  return await db.query(sqlQuery, [queryEmbedding, rawText, topK]);
}`,
    author: '김개발 (백엔드 리드)',
    timestamp: '2025-11-14 16:30',
    tags: ['pgvector', 'SQL Optimization', 'Hybrid Search', 'FastAPI']
  },
  {
    id: 'art-2',
    projectId: 'proj-1',
    title: '대용량 문서 chunking 및 메모리 초과(OOM) 해결 회의록',
    type: 'meeting_note',
    content: `[회의 일자]: 2025년 10월 28일
[참석자]: 김개발, 이프론트, 박데이터, 최디자이너
[주제]: 대용량 PPT/PDF 업로드 시 임베딩 파이프라인 OOM 발생 건

1. 문제점
- 100MB 이상 PDF 및 슬라이드 업로드 시 메모리 사용량이 급증하여 FastAPI 컨테이너가 OOM Kitted됨.
- 원인: 전역 메모리 상에 문서 전체 문자열을 로드한 뒤 한 번에 임베딩 모델 호출.

2. 기술적 의사결정 및 해결안
- 문서를 500자 단위 Semantic Chunking으로 분할.
- Celery + Redis 비동기 태스크 큐 도입하여 백그라운드 워커에서 순차 처리.
- 결과: 메모리 피크 사용량 82% 감소 (2.1GB -> 380MB), 동시 처리 건수 3배 향상.`,
    author: '김개발',
    timestamp: '2025-10-28 11:00',
    tags: ['Troubleshooting', 'OOM', 'Celery', 'Redis', 'Meeting Note']
  },
  {
    id: 'art-3',
    projectId: 'proj-1',
    title: '시스템 아키텍처 다이어그램 및 DB 스키마 설계서',
    type: 'architecture',
    content: `[시스템 아키텍처 구조]
Client (React + Vite SPA)
   └── Nginx Reverse Proxy
        ├── REST API: FastAPI Backend Server
        ├── SSE Streaming: Chatbot Response Endpoint
        └── External Storage Connector Pipeline
             ├── GitHub OAuth & Commit Webhook Sync
             ├── Google Drive REST API File Downloader
             └── Notion API Block Extractor

[Database Schema (PostgreSQL 16 + pgvector)]
- Users (1) : (N) Projects
- Projects (1) : (N) Documents & Code Artifacts
- Documents (1) : (N) Vector Embeddings (Chunk size: 500 chars, Overlap: 50 chars)
- Projects (1) : (N) Timeline Events & Git Commits
- Projects (1) : (1) Auto-generated Portfolio Drafts`,
    author: '김개발',
    timestamp: '2025-09-15 14:20',
    tags: ['Architecture', 'Database Schema', 'pgvector', 'OAuth2.0']
  },
  {
    id: 'art-4',
    projectId: 'proj-2',
    title: 'Kafka Consumer Group Rebalance 방지 로직',
    type: 'code',
    language: 'java',
    content: `@KafkaListener(
    topics = "user-notifications",
    groupId = "notification-workers",
    containerFactory = "kafkaListenerContainerFactory"
)
public void consumeNotificationEvent(NotificationPayload payload, Acknowledgment ack) {
    try {
        log.info("Processing notification ID: {}", payload.getNotificationId());
        // 비동기 알림 전송 (Redis WebSocket Server)
        webSocketSenderService.sendToUser(payload.getUserId(), payload.getMessage());
        ack.acknowledge(); // Manual Ack for At-least-once delivery
    } catch (Exception e) {
        log.error("Failed notification delivery, routing to DLQ", e);
        deadLetterQueueTemplate.send("user-notifications-dlq", payload);
        ack.acknowledge();
    }
}`,
    author: '김개발',
    timestamp: '2026-03-12 18:40',
    tags: ['Kafka', 'Dead Letter Queue', 'Spring Boot', 'Manual Ack']
  }
];

export const INITIAL_TIMELINES: TimelineEvent[] = [
  {
    id: 'tl-1',
    projectId: 'proj-1',
    projectTitle: 'AI 기반 프로젝트 검색 및 아카이빙 플랫폼',
    date: '2025-11-14',
    title: 'pgvector 도입 및 Hybrid Search 알고리즘 적용',
    description: '키워드 검색(BM25)과 벡터 유사도 검색을 결합하여 검색 정확도(mAP)를 42% 향상시켰습니다.',
    type: 'troubleshooting',
    author: '김개발',
    commitHash: 'a8f912c',
    impactBadge: '검색 정확도 +42%'
  },
  {
    id: 'tl-2',
    projectId: 'proj-1',
    projectTitle: 'AI 기반 프로젝트 검색 및 아카이빙 플랫폼',
    date: '2025-10-28',
    title: '문서 임베딩시 메모리 초과(OOM) 방지 워커 구축',
    description: 'Celery 비동기 큐 도입과 Semantic Chunking을 적용하여 최대 메모리 사용량을 82% 감소시켰습니다.',
    type: 'troubleshooting',
    author: '김개발',
    commitHash: 'e3c411b',
    impactBadge: '메모리 피크 -82%'
  },
  {
    id: 'tl-3',
    projectId: 'proj-1',
    projectTitle: 'AI 기반 프로젝트 검색 및 아카이빙 플랫폼',
    date: '2025-09-15',
    title: 'GitHub & Google Drive OAuth 2.0 연동 모듈 완성',
    description: '사용자가 소셜 인증만으로 외부 산출물 데이터를 안전하게 자동 수집하도록 인증 파이프라인 구성.',
    type: 'milestone',
    author: '김개발',
    commitHash: 'f1029da',
    impactBadge: '외부 연동 완료'
  },
  {
    id: 'tl-4',
    projectId: 'proj-2',
    projectTitle: '실시간 분산 알림 시스템',
    date: '2026-03-12',
    title: 'Kafka Manual Ack 및 DLQ (Dead Letter Queue) 구성',
    description: '메시지 유실 제로를 보장하며 소비자 장애시 DLQ로 안전 우회하도록 설계.',
    type: 'commit',
    author: '김개발',
    commitHash: 'b45c99e',
    impactBadge: '유실율 0%'
  }
];

export const INITIAL_PORTFOLIO_PROJ_1: PortfolioData = {
  projectId: 'proj-1',
  updatedAt: '2025-12-21 10:30',
  executiveSummary: {
    servicePurpose: '자연어로 프로젝트 산출물(코드, 문서, 회의록)을 자유롭게 검색하고, AI 기반으로 개발자 맞춤형 포트폴리오를 자동 추출·설계하는 올인원 아카이빙 서비스',
    targetAudience: '프로젝트 경험은 많으나 이를 체계적인 기술 포트폴리오로 정리하는 데 어려움을 겪는 주니어/경력 개발자 및 취업 준비생',
    period: '2025.09 ~ 2025.12 (4개월)',
    teamSize: '5인 팀 (백엔드 2, 프론트엔드 2, AI/데이터 1)',
    myPosition: '백엔드 리드 & AI 데이터 파이프라인 건축 담당',
    oneLineSummary: '흩어진 프로젝트 산출물과 커밋 히스토리를 AI로 자동 분석하여 맞춤형 포트폴리오 및 면접 대비 자원을 생성하는 개발자 아카이빙 플랫폼'
  },
  techStackAndArchitecture: {
    techList: [
      {
        techName: 'FastAPI (Python)',
        category: 'Backend',
        reasonForAdoption: 'AI 임베딩 모델과의 직접적 연동 용이성 및 비동기 ASGI 처리를 통한 빠른 응답 속도 확보'
      },
      {
        techName: 'PostgreSQL + pgvector',
        category: 'Database',
        reasonForAdoption: '별도의 외부 벡터 DB 도입 부담을 줄이고, 관계형 데이터와 벡터 유사도 검색을 단일 DB 인프라에서 결합'
      },
      {
        techName: 'Gemini 3.6 Flash API',
        category: 'AI/ML',
        reasonForAdoption: '대용량 컨텍스트 처리 능력과 압도적인 한국어 포트폴리오 구조화 및 트러블슈팅 추론 품질 제공'
      },
      {
        techName: 'Celery + Redis',
        category: 'Architecture',
        reasonForAdoption: '대용량 PDF/PPT 수집 시 메인 API 서버의 멈춤 없이 백그라운드 분산 비동기 처리 적용'
      }
    ],
    systemArchitectureDesc: '클라이언트 React SPA에서 요청 시 Express/Nginx 가중치를 거쳐 FastAPI 백엔드로 전달됩니다. 업로드된 문서는 Celery 워커에 의해 Semantic Chunking되어 pgvector에 임베딩되며, 포트폴리오 생성 시 Gemini 3.6 Flash가 깃 커밋 및 회의록을 종합하여 STAR 형식으로 자동 정리합니다.',
    erdSummary: 'Users(1) - Projects(N) - Documents(N) - VectorChunks(N) 관계 구조. pgvector 인덱스로 cosine similarity 검색 속도를 15ms 이내로 단축하도록 1:N 벡터 파티셔닝 설계.'
  },
  keyContributions: [
    {
      id: 'kc-1',
      title: 'FastAPI 기반 대용량 문서 비동기 전처리 파이프라인 구축',
      description: 'Pandas 및 PyPDF를 활용한 대규모 원천 데이터 파싱 및 정제 자동화를 담당하고, Celery 분산 큐로 비동기화하였습니다.',
      impactMetrics: '문서 업로드 응답 지연 82% 감소, 파이프라인 처리량 3배 향상'
    },
    {
      id: 'kc-2',
      title: 'GitHub / Google Drive OAuth 2.0 기반 인증 및 동기화 인프라',
      description: '외부 소스 저장소 연동을 위해 OAuth 2.0 토큰 갱신 및 Webhook 이벤트 수신기 파이프라인을 구축하였습니다.',
      impactMetrics: '산출물 자동 연동 수집률 99.4% 달성'
    }
  ],
  troubleshootingList: [
    {
      id: 'ts-1',
      title: '대용량 문서 임베딩 시 서버 메모리 초과(OOM) 현상 해결',
      situation: '100MB 이상의 프로젝트 문서 및 발표 슬라이드 업로드 시, 메인 FastAPI 서버 메모리가 피크에 달해 OOM Killed(Exit Code 137) 장애가 빈번히 발생함.',
      action: '문서를 500자 단위 Semantic Chunking으로 나눈 뒤, Celery + Redis 비동기 처리 큐를 도입하여 백그라운드 워커에서 메모리 사용량을 인메모리 상한 내로 엄격히 제한함.',
      result: '서버 Peak 메모리 사용량 82% 감소 (2.1GB -> 380MB) 및 서버 다운 제로 달성.',
      tags: ['OOM', 'Celery', 'Redis', 'Chunking']
    },
    {
      id: 'ts-2',
      title: '키워드 단일 검색 시 연관 산출물 누락 이슈 해결 (Hybrid Search)',
      situation: '개발자가 "인증 장애"로 검색했을 때 단순 키워드 매칭(BM25) 방식으로는 "OAuth Token Refresher" 관련 코드가 검색 결과에서 누락됨.',
      action: 'pgvector 임베딩 검색(Cosine Similarity)과 PostgreSQL Full-text tsvector 키워드 검색을 7:3 비율로 결합한 Hybrid Search 알고리즘 쿼리 작성.',
      result: '의미론적 검색 정확도(mAP) 42% 향상 및 기술 용어 동의어 매칭율 극대화.',
      tags: ['pgvector', 'Hybrid Search', 'BM25', 'SQL Optimization']
    }
  ],
  retrospective: {
    technicalGrowth: '단순 CRUD 생성을 넘어 대용량 벡터 임베딩, 비동기 메시지 큐, Hybrid Search 기법을 실전 서비스 인프라에 직접 녹여내며 아키텍트 수준의 문제 해결 능력을 갖추게 되었습니다.',
    collaborationInsights: '프론트엔드 파트너 및 데이터 팀과의 매주 기술 아키텍처 sync 회의를 주도하고 Swagger OpenAPI 명세를 엄격히 준수하여 API 통합 단계를 단 2일 만에 성공적으로 마쳤습니다.',
    futureImprovements: '향후 로컬 LLM 양자화 모델 도입을 통해 오프라인 환경에서도 개인 프로젝트 보안 아카이빙이 가능하도록 확장할 계획입니다.'
  }
};

export const INITIAL_INTERVIEW_ITEMS: InterviewPrepItem[] = [
  {
    id: 'int-1',
    projectId: 'proj-1',
    category: '건축/아키텍처',
    question: '왜 Pinecone이나 Milvus 같은 전용 Vector DB 대신 PostgreSQL의 pgvector를 선택하셨나요?',
    sampleAnswer: '단순히 새로운 기술을 도입하는 것보다 프로젝트의 인프라 복잡도와 유지보수 비용을 최우선으로 고려했습니다. 우리 서비스는 프로젝트 마스터 데이터, 사용자 계정, 커밋 기록 등 강력한 RDBMS 관계형 데이터가 핵심이었습니다. 전용 Vector DB를 도입할 경우 PostgreSQL과의 데이터 동기화 이슈 및 인프라 파편화 비용이 증가합니다. pgvector를 사용하면 단일 DB 트랜잭션 내에서 비기능적 벡터 유사도 검색과 관계형 Join을 15ms 이내의 뛰어난 성능으로 처리할 수 있어 최선의 선택이었습니다.',
    keyCheckingPoints: [
      '기술 선택 시 비즈니스 요구사항과 인프라 유지보수 비용 고려 여부',
      'RDBMS와 Vector DB 간 동기화 이슈 이해도',
      'pgvector의 작동 원리 및 성능 지표 제시'
    ],
    followUpQuestions: [
      'pgvector 인덱싱 방식 중 IVFFlat과 HNSW의 차이는 무엇이며 어떤 인덱스를 적용했나요?',
      '데이터 양이 1,000만 건 이상으로 대형화될 때 Scale-out 전략은 무엇인가요?'
    ]
  },
  {
    id: 'int-2',
    projectId: 'proj-1',
    category: '트러블슈팅',
    question: '대용량 문서 업로드 시 발생했던 OOM(Out of Memory) 문제를 해결했던 과정에 대해 STAR 기법으로 설명해 주세요.',
    sampleAnswer: 'Situation: 100MB 이상 크기의 PPT/PDF 산출물 업로드 시 메인 백엔드 컨테이너 메모리가 2.1GB까지 치솟아 OOM Killed로 서버가 다운되는 문제가 있었습니다.\nAction: 원인은 메모리 상에 문서 전체를 단일 문자열로 로드하여 한 번에 AI 모델에 전달했기 때문이었습니다. 이를 해결하기 위해 문서를 500자 단위의 Semantic Chunk로 나누고, Celery와 Redis 기반의 비동기 메시지 큐를 구축하여 백그라운드 워커에서 청크별로 메모리를 소모하도록 파이프라인을 재설계했습니다.\nResult: 피크 메모리 사용량이 380MB로 82% 감소하였으며, 동시 문서 수집 요청 처리량이 3배 향상되었습니다.',
    keyCheckingPoints: [
      '문제의 명확한 기술적 원인 규명 능력',
      '단순 메모리 증설이 아닌 구조적 개선(비동기 큐, Chunking) 접근 방식',
      '수치화된 성과(82% 감소) 및 검증 과정'
    ],
    followUpQuestions: [
      'Celery 워커 장애 발생 시 처리 중이던 청크 메시지 유실 방지를 위해 어떻게 구성했나요?',
      'Semantic Chunking 시 문장이나 코드가 어색하게 끊기는 문제는 어떻게 보완하셨나요?'
    ]
  }
];

export const INITIAL_COVER_LETTERS: CoverLetterQA[] = [
  {
    id: 'cl-1',
    question: '기술적 어려움을 극복하고 정해진 성과를 달성했던 트러블슈팅 경험을 기술해 주세요.',
    jobTarget: '백엔드 / AI 엔지니어',
    selectedProjectId: 'proj-1',
    projectTitle: 'AI 기반 프로젝트 검색 및 아카이빙 플랫폼',
    generatedAnswer: `[대용량 문서 비동기 파이프라인 전환으로 메모리 OOM 82% 감소 달성]

프로젝트 산출물 아카이빙 플랫폼 개발 당시, 100MB 이상의 대용량 PDF 문서 및 슬라이드 수집 시 FastAPI 백엔드가 OOM(Out of Memory) 현상으로 다운되는 심각한 이슈를 마주했습니다.

원인을 분석한 결과, 전체 문서를 동기식으로 메모리에 적재한 뒤 AI 임베딩 모델을 일괄 호출하는 구조가 원인이었습니다. 단순 서버 스펙 증설은 근본적인 해결책이 아니라고 판단하여 아키텍처 수정을 결단했습니다.

첫째, 문서를 의미 단위인 500자의 Semantic Chunk로 분할하여 메모리 적재량을 최소화했습니다.
둘째, Celery와 Redis 기반 비동기 태스크 큐를 도입하여 문서 업로드 요청과 실제 임베딩 분산 작업을 분리했습니다.

그 결과, Peak 메모리 사용량을 2.1GB에서 380MB로 82% 감축시켰으며, 서버 다운 제로 달성과 함께 동시 수집 처리량을 3배 향상시켰습니다. 문제의 근본 원인을 파악하고 구조적 아키텍처 개선으로 서비스 안정성을 끌어올린 귀중한 경험이었습니다.`,
    starBreakdown: {
      situation: '100MB 이상의 프로젝트 문서 업로드 시 백엔드 컨테이너 메모리 피크로 OOM Killed 발생',
      task: '메모리 폭증의 근본 원인을 규명하고 서비스 다운을 방지하는 비동기 파이프라인 설계',
      action: '500자 Semantic Chunking 및 Celery + Redis 비동기 워커 큐 도입하여 순차 백그라운드 처리',
      result: 'Peak 메모리 사용량 82% 감소 (2.1GB -> 380MB) 및 동시 수집 요청 처리량 3배 향상'
    },
    createdAt: '2025-12-21 14:00'
  }
];
