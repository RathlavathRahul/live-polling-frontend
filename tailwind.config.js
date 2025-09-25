/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6A5ACD", 500: "#6A5ACD", 600: "#5b4fd1" },
      },
      boxShadow: { card: "0 10px 30px rgba(0,0,0,0.08)" },
      borderRadius: { pill: "9999px" },
    },
  },
  plugins: [],
};
