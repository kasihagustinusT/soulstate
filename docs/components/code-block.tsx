'use client';

import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css'; // Or your preferred theme

interface CodeBlockProps {
  code: string;
  language: 'typescript' | 'javascript' | 'tsx' | 'bash' | 'json' | 'text';
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lang = languages[language] ? language : 'text';
  const html = highlight(code.trim(), languages[lang], lang);

  return (
    <div className="my-4 rounded-lg overflow-hidden bg-dark-code-bg border border-dark-border">
      <pre className="!m-0 !p-0">
        <code
          className={`language-${language} !p-4 block !bg-transparent`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
