import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'SoulState',
  tagline: 'The Zero-Overhead State of Mind',
  favicon: 'img/SoulState.ico',

  future: {
    v4: true,
  },

  url: 'https://your-site.com',
  baseUrl: '/',

  organizationName: 'kasihagustinusT',
  projectName: 'soulstate',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
          routeBasePath: '/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',

    colorMode: {
      disableSwitch: true,  
      respectPrefersColorScheme: false,
      defaultMode: 'light',
    },

    navbar: {
      title: 'SoulState',
      logo: {
        alt: 'SoulState Logo',
        src: 'img/SoulState.jpg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation'
        },
        {
          href: 'https://github.com/kasihagustinusT/soulstate',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Introduction',
              to: '/docs/introduction',
            },
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Core Concepts',
              to: '/docs/concepts/store',
            },
          ],
        },
        {
          title: 'API',
          items: [
            {
              label: 'Core Store',
              to: '/docs/api/core-store',
            },
            {
              label: 'React Hooks',
              to: '/docs/api/react',
            },
            {
              label: 'Middleware',
              to: '/docs/api/middleware',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kasihagustinusT/soulstate',
            },
            {
              label: 'npm',
              href: 'https://npmjs.com/package/soulstate',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Internals',
              to: '/docs/internals/engine',
            },
            {
              label: 'Advanced Guides',
              to: '/docs/advanced/architecture',
            },
            {
              label: 'Best Practices',
              to: '/docs/guides/best-practices',
            },
          ],
        },
      ],
      copyright: `© ${2025} SoulState.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
