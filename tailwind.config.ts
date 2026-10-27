import type { Config } from 'tailwindcss';

export default {
  content: ['./entrypoints/**/*.{ts,tsx,html}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        raised: 'var(--raised)',
        ink: 'var(--ink)',
        secondary: 'var(--ink-secondary)',
        muted: 'var(--ink-muted)',
        rule: 'var(--rule)',
        indigo: 'var(--spectrum-indigo)',
        neutral: 'var(--spectrum-neutral)',
        ochre: 'var(--spectrum-ochre)'
      },
      fontFamily: {
        display: ['Fraunces Variable', 'Georgia', 'serif'],
        editorial: ['Newsreader Variable', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        metric: ['IBM Plex Mono', 'monospace']
      }
    }
  }
} satisfies Config;
