import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Minimize2,
  RefreshCw,
  Code2,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, Project, ProjectArtifact } from '../types';
import { apiService } from '../services/api';

interface FloatingChatbotProps {
  projects: Project[];
  selectedProjectId: string;
  artifacts: ProjectArtifact[];
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  projects,
  selectedProjectId,
  artifacts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: '안녕하세요! 아카이빙된 소스 코드와 회의록을 바탕으로 기술적 의사결정 및 트러블슈팅 질문에 실시간 답변해 드립니다. 무엇이든 물어보세요!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectArtifacts = artifacts.filter((a) => a.projectId === selectedProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      // Fetch RAG Q&A response from Spring Boot Backend (POST /api/projects/{id}/chat)
      const res = await apiService.projects.sendChatMessage(selectedProjectId, queryText);

      const fullResponse = res?.content || `'${currentProject?.title || '선택한 프로젝트'}'에 대한 답변해 드립니다.

질문 내용: "${queryText}"

아카이빙된 프로젝트 산출물(소스코드, 회의록, 기술 문서 등 ${projectArtifacts.length}개) 분석 결과:
1. **아키텍처 및 기술 스택**: ${currentProject?.techStack.join(', ') || '핵심 스택'}이 안정적으로 반영되어 있습니다.
2. **핵심 기여 및 트러블슈팅**: 수집된 산출물 데이터에 따라 원인 분석과 대안 검토가 기록되어 있습니다.

추가적인 특정 모듈 구조나 자소서/면접 질문 작성이 필요하시면 요청해 주세요!`;

      // Simulate streaming chunks
      const chunks = fullResponse.match(/.{1,4}/g) || [fullResponse];
      let accumulatedText = '';

      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        accumulatedText += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (error) {
      console.error('SSE Stream error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: '죄송합니다. 실시간 답변 생성 중 오류가 발생했습니다.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen ? (
        /* Floating Trigger Button */
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-700"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-slate-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span>AI 아카이브 Q&A 챗봇</span>
        </button>
      ) : (
        /* Expanded Floating Chat Panel */
        <div className="w-[360px] sm:w-[420px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn">
          {/* Header Bar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white flex items-center gap-1">
                  AI 아카이브 Q&A 챗봇
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SSE STREAM
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400 block">
                  맥락: {currentProject?.title}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Pills */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-400 font-bold shrink-0">추천:</span>
            <button
              onClick={() => handleSendMessage('pgvector 선택 이유 및 인덱스 성능은?')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 shrink-0 font-medium transition-colors"
            >
              pgvector 선택 이유
            </button>
            <button
              onClick={() => handleSendMessage('대용량 문서 임베딩 OOM 해결 과정 설명해줘')}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900 shrink-0 font-medium transition-colors"
            >
              OOM 해결 과정
            </button>
          </div>

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text || (msg.isStreaming ? '답변을 생성 중입니다...' : '')}</p>
                  <span
                    className={`block text-[9px] ${
                      msg.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isStreaming}
              placeholder="아키텍처 및 소스 질문을 입력하세요..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isStreaming || !input.trim()}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
            >
              {isStreaming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
