// Import the default theme object
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Assign Playfair Display (Variable: --font-playfair) to 'serif'
        serif: ['var(--font-playfair)', ...defaultTheme.fontFamily.serif],

        // Assign Poppins (Variable: --font-poppins) to 'sans' (body)
        sans: ['var(--font-poppins)', ...defaultTheme.fontFamily.sans],
      },
      gradientColorStops: theme => ({
        ...theme('colors'),
        'bg-start': '#0d1117',
        'bg-mid': '#000000',
        'bg-end': '#0a0f1a',
      }),
    },
  },
  plugins: [],
};