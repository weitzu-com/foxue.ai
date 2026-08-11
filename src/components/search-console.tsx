"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenText, Search, Sparkles, Languages } from "lucide-react";
import {
  QUESTION_MAX_LENGTH,
  saveQuestionToSession,
} from "@/lib/question-session";
import { trackEvent } from "@/lib/analytics";

const modes = [
  { id: "scripture", label: "找经文", icon: BookOpenText },
  { id: "meaning", label: "问含义", icon: Sparkles },
  { id: "term", label: "查术语", icon: Languages },
  { id: "research", label: "做研究", icon: Search },
];

const examples = [
  "佛教里的“空”是什么意思？",
  "无住是不是消极？",
  "烦恼生起时，怎样观察自己的心？",
];

export function SearchConsole() {
  const router = useRouter();
  const [mode, setMode] = useState("meaning");
  const [query, setQuery] = useState("");

  function openQuestion(question: string, exampleUsed = false) {
    saveQuestionToSession(question, mode);
    trackEvent("question_started", {
      entry_point: "home",
      example_used: exampleUsed,
      input_length: question.trim().length,
      mode,
    });
    router.push("/wenjing");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openQuestion(query);
  }

  return (
    <div className="search-console">
      <div className="search-modes" role="tablist" aria-label="检索方式">
        {modes.map((item) => {
          const Icon = item.icon;
          const selected = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? "is-active" : ""}
              onClick={() => setMode(item.id)}
            >
              <Icon aria-hidden="true" size={15} />
              {item.label}
            </button>
          );
        })}
      </div>
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="home-query" className="sr-only">
          输入佛学问题、经名、句子或术语
        </label>
        <input
          id="home-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入一个问题、经名、句子或术语……"
          autoComplete="off"
          maxLength={QUESTION_MAX_LENGTH}
        />
        <button type="submit">
          <span>回到原典</span>
          <ArrowRight aria-hidden="true" size={19} />
        </button>
      </form>
      <div className="search-examples" aria-label="问题示例">
        <span>可以这样问</span>
        {examples.map((example) => (
          <button key={example} type="button" onClick={() => openQuestion(example, true)}>
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
