/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Public Sans', 'sans-serif'],
        body:    ['Public Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light:   'var(--color-primary-light)',
          dark:    'var(--color-primary-dark)',
          subtle:  'var(--color-primary-subtle)',
        },
        surface:    'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border:     'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        success:    'var(--color-success)',
        warning:    'var(--color-warning)',
        danger:     'var(--color-danger)',
        info:       'var(--color-info)',
      },
    },
  },
  plugins: [],
}
