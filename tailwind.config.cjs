/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'pomodoro-red': 'rgb(238, 28, 46)',
        'pomodoro-blue': 'rgb(33, 150, 243)',
        'pomodoro-purple': 'rgb(156, 39, 176)',
        'pomodoro-orange': 'rgb(255, 152, 0)',
        'break-green': '#4CAF50',
        gray: {
          50: '#f8f9fa',
          200: '#e9ecef',
          208: '#d0d0d0',
          232: '#e8e8e8',
          240: '#f0f0f0',
        },
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'monospace'],
      },
      spacing: {
        '7.5': '1.875rem',
        '15': '3.75rem',
        '125': '31.25rem',
        '162.5': '40.625rem',
      },
      width: {
        '15': '3.75rem',
        '50': '12.5rem',    // 200px (컴팩트 모드)
        '80': '20rem',
        '100': '25rem',     // 400px (일반 모드)
      },
      height: {
        '15': '3.75rem',
        '68.75': '17.1875rem',  // 275px (컴팩트 모드)
        '137.5': '34.375rem',   // 550px (일반 모드)
      },
      zIndex: {
        '25': '25',
        '990': '990',
        '998': '998',
        '999': '999',
        '1000': '1000',
        '1002': '1002',
      },
      animation: {
        'slideInRight': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
}