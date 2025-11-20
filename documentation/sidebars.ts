import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'getting-started',
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/store',
        'concepts/subscriptions',
        'concepts/batching',
        'concepts/selectors',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/core-store',
        'api/get-state',
        'api/set-state',
        'api/subscribe',
        'api/react',
        'api/middleware',
        'api/utilities',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/architecture',
        'advanced/performance',
        'advanced/microtasks',
      ],
    },
    {
      type: 'category',
      label: 'Internals',
      items: [
        'internals/engine',
        'internals/mutation',
        'internals/linked-list',
        'internals/why-no-proxies',
        'internals/comparison-zustand',
      ],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      items: [
        'guides/admin-dashboard',
        'guides/best-practices',
        'guides/modular-stores',
        'guides/large-scale-architecture',
        'guides/testing-stores',
        'guides/performance-tuning',
      ],
    },
  ],
};

export default sidebars;
