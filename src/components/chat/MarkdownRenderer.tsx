import { useMemo } from "react";
import DOMPurify from "dompurify";

interface MarkdownRendererProps {
  content: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Simple markdown rendering — converts basic patterns to HTML.
// For a course project, this is good enough. A full markdown parser
// (like marked or react-markdown) can be added if needed.
function renderMarkdown(content: string): string {
  // Code (fenced and inline) is pulled out into placeholders first so the
  // bold/italic/line-break rules below don't rewrite what's inside it.
  const codeSnippets: string[] = [];
  const stash = (html: string) => `\u0000${codeSnippets.push(html) - 1}\u0000`;

  const html = escapeHtml(content)
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang: string, code: string) =>
      stash(`<pre><code class="lang-${lang}">${code}</code></pre>`)
    )
    // Inline code
    .replace(/`([^`]+)`/g, (_, code: string) => stash(`<code>${code}</code>`))
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Line breaks
    .replace(/\n/g, "<br />")
    // Restore code
    .replace(/\u0000(\d+)\u0000/g, (_, i: string) => codeSnippets[Number(i)] ?? "");

  // Defence in depth: the input is already escaped, but sanitize the final
  // HTML too in case a future rule introduces an injection path.
  return DOMPurify.sanitize(html);
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
