/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          'bg': '#0A0A0A',
          'text': '#F5F5F5',
          'border': '#27272A',
          'primary': '#3B82F6',
          'primary-hover': '#60A5FA',
          'card': '#18181B',
          'code-bg': '#1E1E1E',
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.dark.text'),
            '--tw-prose-headings': theme('colors.dark.text'),
            '--tw-prose-lead': theme('colors.dark.text'),
            '--tw-prose-links': theme('colors.dark.primary'),
            '--tw-prose-bold': theme('colors.dark.text'),
            '--tw-prose-counters': theme('colors.dark.text'),
            '--tw-prose-bullets': theme('colors.dark.border'),
            '--tw-prose-hr': theme('colors.dark.border'),
            '--tw-prose-quotes': theme('colors.dark.text'),
            '--tw-prose-quote-borders': theme('colors.dark.border'),
            '--tw-prose-captions': theme('colors.dark.text'),
            '--tw-prose-code': theme('colors.dark.primary'),
            '--tw-prose-pre-code': theme('colors.dark.text'),
            '--tw-prose-pre-bg': theme('colors.dark.code-bg'),
            '--tw-prose-th-borders': theme('colors.dark.border'),
            '--tw-prose-td-borders': theme('colors.dark.border'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
