"use client"

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import { KeyboardEvent, FormEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function MarkdownComponent({ content }: { content: string }) {
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

export default function Chat() {
  const [input, setInput] = useState<string>("");
  const [atBottom, setAtBottom] = useState<boolean>(true);

  const [toolOutputsShown, setToolOutputsShown] = useState<string[]>([]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai", // So we use the right route, see https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#transport.default-chat-transport
    }),
  });

  // Auto scroll to bottom when new messages come up
  useEffect(() => {
    if (messagesRef.current && atBottom) {
      messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight);
    }
  }, [messages, atBottom]);

  const handleScroll = () => {
    if (messagesRef.current && messagesRef.current.scrollTop + messagesRef.current.clientHeight >= messagesRef.current.scrollHeight) {
      setAtBottom(true);
    } else {
      setAtBottom(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Check if the key is a single, printable character
    if (e.key.length === 1 && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');

    if (messagesRef.current) {
      setAtBottom(true); // Just force it
    }
  };

  const handleToolClick = (messageKey: string) => {
    setToolOutputsShown((prevToolOutputsShown: string[]): string[] => {
      if (prevToolOutputsShown.includes(messageKey)) {
        const newToolOutputsShown = [...prevToolOutputsShown];
        newToolOutputsShown.splice(newToolOutputsShown.indexOf(messageKey), 1);
        return newToolOutputsShown;
      } else {
        const newToolOutputsShown = [
          ...prevToolOutputsShown,
          messageKey,
        ];
        return newToolOutputsShown;
      }
    });
  };

  return (
    <div
      className="flex flex-col bg-zinc-900 outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex flex-col w-full h-dvh max-w-7xl mx-auto px-4">
        <div className="overflow-auto px-5 py-6 h-full" ref={messagesRef} onScroll={handleScroll}>
          {messages.map(message => (
            <div key={message.id}>
              {message.parts.map((part, i) => {
                const messageKey = `${message.id}-${i}`;

                if (part.type === "text") {
                  if (message.role === 'user') {
                    return (
                      <div
                        key={messageKey}
                        className="py-3 flex justify-end"
                      >
                        <div className="rounded-full bg-blue-950 p-3 inline">
                          <MarkdownComponent content={part.text} />
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={messageKey}>
                        <MarkdownComponent content={part.text} />
                      </div>
                    );
                  }
                } else if (part.type.startsWith("tool-")) {
                  return (
                    <div
                      key={messageKey}
                      className="py-3 mb-3"
                    >
                      <div className="bg-slate-800 rounded-[5px] p-3 inline cursor-pointer select-none" onClick={() => handleToolClick(messageKey)}>
                          <span>Calling {part.type}</span>
                          <button className="relative top-2 ml-2">
                            {toolOutputsShown.includes(messageKey) ? <ChevronUp /> : <ChevronDown />}
                          </button>
                      </div>
                      <div className={`bg-slate-700 p-3 whitespace-pre-wrap ${toolOutputsShown.includes(messageKey) ? "" : "hidden"}`}>
                        {JSON.stringify(part, null, 2)}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grow"
        >
          <input
            className="dark:bg-zinc-900 w-full p-2 mb-4 border border-zinc-300 dark:border-zinc-800 outline-none rounded shadow-xl"
            value={input}
            ref={inputRef}
            placeholder="Say something..."
            onChange={e => setInput(e.currentTarget.value)}
          />
        </form>
      </div>
    </div>
  );
}
