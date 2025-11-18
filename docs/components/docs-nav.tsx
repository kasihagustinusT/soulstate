'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    group: 'Getting Started',
    items: [
      { name: 'Introduction', href: '/' },
      { name: 'Installation', href: '/getting-started' },
    ],
  },
  {
    group: 'Core Concepts',
    items: [
      { name: 'The Store', href: '/concepts/store' },
      { name: 'Subscriptions', href: '/concepts/subscriptions' },
      { name: 'Batching', href: '/concepts/batching' },
      { name: 'Selectors', href: '/concepts/selectors' },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { name: 'createStore', href: '/api/core-store' },
      { name: 'React Hooks', href: '/api/react' },
      { name: 'Middleware', href: '/api/middleware' },
    ],
  },
  {
    group: 'Internals',
    items: [
      { name: 'Architecture', href: '/internals/architecture' },
      { name: 'Batching Engine', href: '/internals/batching-engine' },
      { name: 'Subscription Graph', href: '/internals/subscription-graph' },
      { name: 'Performance', href: '/internals/performance' },
    ],
  },
];

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <span
        className={`
          block w-full px-3 py-1.5 text-sm rounded-md transition-colors
          ${isActive
            ? 'bg-dark-primary text-white'
            : 'text-gray-400 hover:bg-dark-card hover:text-white'
          }
        `}
      >
        {children}
      </span>
    </Link>
  );
}

export function DocsNav() {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 border-r border-dark-border p-6 overflow-y-auto">
      <Link href="/" className="block mb-8">
        <h1 className="text-xl font-bold text-white">🔥 SoulState</h1>
      </Link>
      <nav className="space-y-6">
        {navigation.map((group) => (
          <div key={group.group}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.group}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItem key={item.href} href={item.href}>
                  {item.name}
                </NavItem>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
