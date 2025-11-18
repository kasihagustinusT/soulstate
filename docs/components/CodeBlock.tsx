"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";

// Import Prism languages (yang kamu butuhkan)
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";

// Import theme
import "prismjs/themes/prism-tomorrow.css";

export default function CodeBlock({
  children,
  language = "tsx",
}: {
  children: string;
  language?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current);
    }
  }, []);

  return (
    <pre>
      <code
        ref={ref}
        className={`language-${language}`}
      >
        {children.trim()}
      </code>
    </pre>
  );
}
