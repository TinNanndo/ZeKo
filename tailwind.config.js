/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust paths as needed
  ],
  theme: {
    extend: {
      colors: {
        cdarkgreen: '#1E3123',
        cgreen: '#2E4834'
      }
    },
  },
  plugins: [],
};
