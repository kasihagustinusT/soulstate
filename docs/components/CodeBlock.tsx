'use client';

import { highlight } from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // Or your preferred theme
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';

// A simple code block component with syntax highlighting
export function CodeBlock({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  const html = highlight(children.trim(), (window as any).Prism.languages[language], language);
  return (
    <pre>
      <code
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  );
}
