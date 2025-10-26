"use client"

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export default function MarkdownComponent({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkBreaks]}
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >{content}</Markdown>
  );
}
