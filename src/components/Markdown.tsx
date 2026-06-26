"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the assistant's plain-text reply as Markdown. react-markdown does NOT
 * render raw HTML by default (no rehype-raw), so even if the model emitted
 * `<script>` it shows as text — this *enforces* the no-model-HTML invariant
 * rather than fighting it. Links open in a new tab. Styling lives in `.md`
 * (globals.css), since Tailwind v4 ships no typography plugin here.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
