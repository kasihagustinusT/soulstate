import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DocsNav } from '../components/docs-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SoulState: The Zero-Overhead State of Mind',
    template: '%s | SoulState',
  },
  description: 'Effortless, scalable, and high-performance state management for modern web applications.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-dark-bg text-dark-text">
        <div className="flex min-h-screen">
          <DocsNav />
          <main className="flex-1 pl-72 pr-8 py-10">
            <article className="prose prose-invert max-w-4xl">
              {children}
            </article>
          </main>
        </div>
      </body>
    </html>
  );
}
