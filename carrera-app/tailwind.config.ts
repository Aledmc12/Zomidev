import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        carrera: {
          red: '#b30000',
          dark: '#222',
        },
      },
      maxWidth: {
        form: '920px',
      },
    },
  },
  plugins: [],
}
export default config
