import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 p-4 border-r">
      <h1 className="text-2xl font-bold">
        <Link href="/">SoulState</Link>
      </h1>
      <nav className="mt-8">
        <h2 className="font-semibold">Documentation</h2>
        <ul>
          <li><Link href="/getting-started" className="text-blue-600 hover:underline">Getting Started</Link></li>
          <li><Link href="/api-reference" className="text-blue-600 hover:underline">API Reference</Link></li>
        </ul>
        {/* More links can be added here */}
      </nav>
    </aside>
  );
}
