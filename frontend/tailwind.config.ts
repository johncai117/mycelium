import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Scientific neutral palette
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',  // primary accent
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Confidence level colors
        confidence: {
          high:   '#16a34a',  // green-600
          medium: '#ca8a04',  // yellow-600
          low:    '#ea580c',  // orange-600
        },
        // Status badge colors
        status: {
          drafting:  '#2563eb',  // blue
          review:    '#ca8a04',  // yellow
          exported:  '#16a34a',  // green
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
