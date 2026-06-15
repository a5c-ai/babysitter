"use client";

import * as React from "react";

type CopyableTextProps = {
  text: string;
  mode?: "pre" | "textarea";
  rows?: number;
  copyLabel?: string;
  copiedLabel?: string;
  downloadLabel?: string;
  filename?: string;
  languageLabel?: string;
  textareaLabel?: string;
  preClassName?: string;
  preStyle?: React.CSSProperties;
};

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function CopyableText({
  text,
  mode = "pre",
  rows = 12,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  downloadLabel = "Download",
  filename,
  languageLabel,
  textareaLabel = "Copyable text",
  preClassName = "atlas-docs-pre",
  preStyle,
}: CopyableTextProps) {
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    await copyText(text);
    setCopied(true);
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="atlas-copyable-text">
      <div className="atlas-copyable-text__toolbar">
        {languageLabel ? <span className="atlas-copyable-text__label">{languageLabel}</span> : null}
        <button type="button" className="atlas-header__button" onClick={handleCopy}>
          {copied ? copiedLabel : copyLabel}
        </button>
        {filename ? (
          <button type="button" className="atlas-header__button" onClick={() => downloadText(filename, text)}>
            {downloadLabel}
          </button>
        ) : null}
      </div>
      {mode === "textarea" ? (
        <textarea
          className="atlas-copyable-text__textarea"
          readOnly
          rows={rows}
          aria-label={textareaLabel}
          value={text}
        />
      ) : (
        <pre className={preClassName} style={preStyle}>
          <code>{text}</code>
        </pre>
      )}
    </div>
  );
}
