"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-semibold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const fenced = Boolean(className);
    if (fenced) {
      return (
        <code className={cn("font-mono text-[11px] leading-relaxed", className)}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-relaxed">
      {children}
    </pre>
  ),
};

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2.5 [&_a]:break-all">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </Markdown>
    </div>
  );
}
