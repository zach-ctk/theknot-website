/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Brand colors - using CSS variables so Keystatic can override
        'tkcg-rust': 'var(--color-rust, #B94237)',
        'tkcg-limestone': 'var(--color-limestone, #D0D96F)',
        'tkcg-manatee': 'var(--color-manatee, #84BABF)',
        'tkcg-coral': 'var(--color-coral, #C97065)',
        'tkcg-surf': 'var(--color-surf, #0B4F6C)',
        'tkcg-deep-water': 'var(--color-deep-water, #073447)',
        'tkcg-milkweed': 'var(--color-milkweed, #F2F3AE)',
        'tkcg-graphite': 'var(--color-graphite, #39393B)',
        'tkcg-sand': 'var(--color-sand, #FAF9F5)',
        // Semantic aliases
        primary: 'var(--color-rust, #B94237)',
        secondary: 'var(--color-manatee, #84BABF)',
        accent: 'var(--color-coral, #C97065)',
        // Legacy aliases
        rust: 'var(--color-rust, #B94237)',
        coral: 'var(--color-coral, #C97065)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Zing Rust', 'Uniform Pro', 'sans-serif'],
        heading: ['var(--font-heading)', 'Uniform Pro', 'sans-serif'],
        body: ['var(--font-body)', 'Rubik', 'Uniform Pro', 'sans-serif'],
      },
      letterSpacing: {
        heading: '-0.02em',
        tight: '-0.02em',
      },
      fontSize: {
        // Design token system - matches Canva specifications
        'heading-xl': ['56px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '900' }],
        'heading-lg': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-md': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'subheading': ['14px', { lineHeight: '1.5', fontWeight: '700' }],
      },
      spacing: {
        'btn-blue-w': '500px',
        'btn-blue-h': '55px',
        'btn-red-w': '225px',
        'btn-red-h': '55px',
      },
    },
  },
  plugins: [],
};
