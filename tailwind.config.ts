import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fbf9f8',
          dim: '#dcd9d9',
          bright: '#ffffff',
          container: '#f0eded',
          'container-low': '#f5f3f2',
          'container-high': '#eae8e7',
          'container-highest': '#e4e2e1',
        },
        brand: {
          50: '#d7e5e7',
          100: '#beccce',
          200: '#bbc9cb',
          300: '#9cb0b2',
          400: '#7d9496',
          500: '#4a5759',
          600: '#3c494b',
          700: '#334042',
          800: '#253335',
          900: '#1b2526',
        },
        sage: {
          50: '#d3e8d4',
          100: '#b8ccb9',
          200: '#b0c4b1',
          500: '#516353',
          600: '#394b3c',
          700: '#2a3c2d',
        },
        blush: {
          50: '#ffd9de',
          100: '#f8b9c2',
          200: '#f5b6bf',
          500: '#edafb8',
          600: '#c4838e',
          700: '#77474f',
        },
        success: {
          50: '#d3e8d4',
          100: '#b8ccb9',
          200: '#b0c4b1',
          500: '#516353',
          600: '#394b3c',
          700: '#2a3c2d',
          900: '#1a2e1c',
        },
        warning: {
          50: '#fff6e4',
          100: '#fde8b7',
          200: '#fbd786',
          500: '#e89a1e',
          900: '#4f340c',
        },
        'on-surface': '#1b1c1c',
        'on-surface-variant': '#424848',
        outline: '#737879',
        'outline-variant': '#c3c7c8',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(74, 87, 89, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
