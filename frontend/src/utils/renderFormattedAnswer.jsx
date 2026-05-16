import CodeBlock from "../components/common/CodeBlock";

const renderInlineFormatting = (text = "") => {
  const parts = text.split(/(`[^`]+`|\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code className="inline-code" key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
};

const inferLanguageFromCode = (code = "") => {
  const trimmed = code.trim();

  if (/<!DOCTYPE html>|<html|<head|<body|<div|<script|<style/i.test(trimmed)) {
    return "html";
  }

  if (/^\s*(const|let|var|function|import |export |async function|document\.|window\.|fetch\()/m.test(trimmed)) {
    return "javascript";
  }

  if (/^\s*(#include|using namespace|int main\s*\(|std::)/m.test(trimmed)) {
    return "cpp";
  }

  if (/^\s*(def |import |from |print\()/m.test(trimmed)) {
    return "python";
  }

  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/im.test(trimmed)) {
    return "sql";
  }

  if (/^\s*([.#]?[\w-]+\s*\{|:root\s*\{|@media|@keyframes)/m.test(trimmed)) {
    return "css";
  }

  return "code";
};

const looksLikeCodeLine = (line = "") => {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  return /^(#include|from |import |export |const |let |var |function |class |def |public |private |if\s*\(|for\s*\(|while\s*\(|return\b|<[^>]+>|body\s*\{|\.?\w+\s*\{|[A-Za-z_]\w*\s*\([^)]*\)\s*\{|console\.log|std::|using namespace|SELECT\b|INSERT\b|UPDATE\b|DELETE\b)/i.test(trimmed)
    || /[;{}<>]/.test(trimmed);
};

const extractCodeLikeParagraph = (content = "") => {
  const lines = content.split("\n").map((line) => line.trimEnd());
  const codeLines = [];

  for (const line of lines) {
    if (looksLikeCodeLine(line)) {
      codeLines.push(line);
    }
  }

  if (codeLines.length < 2) {
    return null;
  }

  return codeLines.join("\n").trim();
};

const detectStandaloneCodeBlock = (text = "") => {
  const lines = text.replace(/\r/g, "").split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim());

  if (nonEmptyLines.length < 4) {
    return null;
  }

  const codeLines = nonEmptyLines.filter((line) => looksLikeCodeLine(line));
  const codeRatio = codeLines.length / nonEmptyLines.length;

  if (codeRatio < 0.55) {
    return null;
  }

  return nonEmptyLines.join("\n").trim();
};

const buildTextBlocks = (text = "") => {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks = [];
  let bulletItems = [];
  let numberItems = [];
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    const content = paragraphLines.join("\n").trim();
    if (content) {
      blocks.push({ type: "paragraph", content });
    }
    paragraphLines = [];
  };

  const flushBullets = () => {
    if (!bulletItems.length) {
      return;
    }

    blocks.push({ type: "bullet-list", items: [...bulletItems] });
    bulletItems = [];
  };

  const flushNumbers = () => {
    if (!numberItems.length) {
      return;
    }

    blocks.push({ type: "number-list", items: [...numberItems] });
    numberItems = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushBullets();
      flushNumbers();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushBullets();
      flushNumbers();
      blocks.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2].trim() });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushNumbers();
      bulletItems.push(bulletMatch[1].trim());
      return;
    }

    const numberMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      flushParagraph();
      flushBullets();
      numberItems.push(numberMatch[1].trim());
      return;
    }

    flushBullets();
    flushNumbers();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushBullets();
  flushNumbers();

  return blocks;
};

const parseCodeFence = (value = "") => {
  const match = value.match(/^```([\w-]*)\n?([\s\S]*?)```$/);

  if (!match) {
    return { code: value, language: "code" };
  }

  return {
    language: match[1] || "code",
    code: match[2].trimEnd()
  };
};

export const renderFormattedAnswer = (text = "") => {
  const standaloneCode = detectStandaloneCodeBlock(text);

  if (standaloneCode) {
    return <CodeBlock code={standaloneCode} language={inferLanguageFromCode(standaloneCode)} />;
  }

  const codePattern = /```[\w-]*\n[\s\S]*?```/g;
  const codeMatches = text.match(codePattern) || [];
  const parts = text.split(codePattern);
  const segments = [];

  parts.forEach((part, index) => {
    if (part) {
      segments.push({ type: "text", value: part });
    }

    if (codeMatches[index]) {
      segments.push({ type: "code", value: codeMatches[index] });
    }
  });

  return segments.flatMap((segment, segmentIndex) => {
    if (segment.type === "code") {
      const parsed = parseCodeFence(segment.value);
      return (
        <CodeBlock
          code={parsed.code}
          key={`code-${segmentIndex}`}
          language={parsed.language === "code" ? inferLanguageFromCode(parsed.code) : parsed.language}
        />
      );
    }

    return buildTextBlocks(segment.value).map((block, blockIndex) => {
      const key = `segment-${segmentIndex}-block-${blockIndex}`;

      if (block.type === "heading") {
        if (block.level === 1) {
          return <h2 className="answer-h1" key={key}>{renderInlineFormatting(block.content)}</h2>;
        }
        if (block.level === 2) {
          return <h3 className="answer-h2" key={key}>{renderInlineFormatting(block.content)}</h3>;
        }
        return <h4 className="answer-h3" key={key}>{renderInlineFormatting(block.content)}</h4>;
      }

      if (block.type === "bullet-list") {
        return (
          <ul className="answer-list" key={key}>
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{renderInlineFormatting(item)}</li>
            ))}
          </ul>
        );
      }

      if (block.type === "number-list") {
        return (
          <ol className="answer-list ordered" key={key}>
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{renderInlineFormatting(item)}</li>
            ))}
          </ol>
        );
      }

      const inferredCode = block.type === "paragraph" ? extractCodeLikeParagraph(block.content) : null;
      if (inferredCode) {
        return <CodeBlock code={inferredCode} key={key} language={inferLanguageFromCode(inferredCode)} />;
      }

      return <p className="message-text" key={key}>{renderInlineFormatting(block.content)}</p>;
    });
  });
};
