'use client';
import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Load languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';

export default function CodeBlock({ children, language = 'typescript' }: { children: string; language?: string }) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <pre className={`language-${language} rounded-md`}>
      <code className={`language-${language}`}>
        {children.trim()}
      </code>
    </pre>
  );
}
