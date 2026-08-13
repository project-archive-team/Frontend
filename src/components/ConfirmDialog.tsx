import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  /** 확인 버튼만 필요한 안내면 true. */
  noticeOnly?: boolean;
  onConfirm?: () => void;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState | null;
  onClose: () => void;
}

/**
 * 브라우저 기본 alert/confirm 대신 쓰는 앱 내부 모달.
 * 모양은 NewProjectModal과 같은 껍데기를 따른다.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onClose }) => {
  // 훅은 조건부로 부를 수 없어 early return보다 위에 둔다.
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onClose]);

  if (!state) return null;

  const confirm = () => {
    state.onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h2 id="confirm-dialog-title" className="text-base font-bold">{state.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line break-keep">
            {state.message}
          </p>

          <div className="flex items-center justify-end gap-2">
            {!state.noticeOnly && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
            )}
            <button
              onClick={confirm}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {state.confirmLabel ?? '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
