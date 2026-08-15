import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * AI 응답은 마크다운으로 온다. 그대로 뿌리면 `**`, `-`, `###`가 글자로 보여 읽기 어렵다.
 *
 * 폰트 크기는 감싸는 쪽을 따르고, 여기서는 간격과 강조만 잡는다.
 */
export const Markdown: React.FC<{ children: string; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`leading-relaxed break-keep ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="font-bold mt-3 mb-1.5 first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {children}
          </a>
        ),
        code: ({ className: cls, children }) => {
          // 코드 블록은 ```가 붙으면 language-* 클래스가 생긴다. 인라인 코드와 다르게 그린다.
          const isBlock = Boolean(cls);
          return isBlock ? (
            <code className="block bg-slate-900 text-slate-100 rounded-lg p-2.5 my-2 overflow-x-auto font-mono text-[11px] whitespace-pre">
              {children}
            </code>
          ) : (
            <code className="bg-slate-200/70 text-slate-800 rounded px-1 py-0.5 font-mono text-[0.9em]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-slate-300 pl-3 my-2 text-slate-600">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="w-full border-collapse text-[11px]">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-slate-200 px-2 py-1 bg-slate-50 font-bold">{children}</th>,
        td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
        hr: () => <hr className="my-3 border-slate-200" />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);
