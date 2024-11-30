/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        helvetica: {
          black: ['HelveticaNeueBlack', 'sans-serif'],
          blackItalic: ['HelveticaNeueBlackItalic', 'sans-serif'],
          bold: ['HelveticaNeueBold', 'sans-serif'],
          boldItalic: ['HelveticaNeueBoldItalic', 'sans-serif'],
          heavy: ['HelveticaNeueHeavy', 'sans-serif'],
          heavyItalic: ['HelveticaNeueHeavyItalic', 'sans-serif'],
          italic: ['HelveticaNeueItalic', 'sans-serif'],
          light: ['HelveticaNeueLight', 'sans-serif'],
          lightItalic: ['HelveticaNeueLightItalic', 'sans-serif'],
          medium: ['HelveticaNeueMedium', 'sans-serif'],
          mediumItalic: ['HelveticaNeueMediumItalic', 'sans-serif'],
          roman: ['HelveticaNeueRoman', 'sans-serif'],
          thin: ['HelveticaNeueThin', 'sans-serif'],
          thinItalic: ['HelveticaNeueThinItalic', 'sans-serif'],
          ultraLight: ['HelveticaNeueUltraLight', 'sans-serif'],
          ultraLightItalic: ['HelveticaNeueUltraLightItalic', 'sans-serif'],
        },
      },
    },
  },
  plugins: [],
};
