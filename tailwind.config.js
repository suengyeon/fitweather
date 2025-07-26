// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lilita: ['"Lilita One"', "cursive"],
        // 또는 baloo: ["'Baloo 2'", "sans-serif"]
      },
    },
  },
  plugins: [],
};
