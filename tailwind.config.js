/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        ink: { DEFAULT: '#0B0A14', soft: '#15132370' },
        night: '#0B0A14',
        veil: '#141227',
        edge: '#241F3D',
        saffron: '#F5A524',
        marigold: '#FFC24B',
        lotus: '#E85D9A',
        indigo: { deep: '#4C3BCF', glow: '#7C6BFF' },
        jade: '#2FBF9B',
        chalk: '#F4F1EA',
        mute: '#9A93B8',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -12px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(124,107,255,0.35), 0 8px 40px -8px rgba(124,107,255,0.45)',
      },
    },
  },
  plugins: [],
}
