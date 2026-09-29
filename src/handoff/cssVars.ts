/** css-vars.css — generated CSS custom properties (subset; full file at src/styles/tokens.css) */
export const cssVars = `/* HFAS — css-vars.css (generated from tokens.json) */
:root {
  /* color / primary */
  --color-primary-50: #eef6ff;
  --color-primary-100: #d9ecff;
  --color-primary-200: #b0d2ff;
  --color-primary-300: #7fb3fd;
  --color-primary-400: #4d8ef7;
  --color-primary-500: #2668e8;
  --color-primary-600: #1a4fc6;
  --color-primary-700: #163da0;
  --color-primary-800: #14357f;
  --color-primary-900: #122c66;

  /* semantic */
  --color-success-50: #e7f8ef;
  --color-success-100: #c4eed6;
  --color-success-500: #1e9e5a;
  --color-success-600: #157a44;
  --color-success-700: #0f5c33;
  --color-error-50: #fdeeee;
  --color-error-100: #f9d6d6;
  --color-error-500: #d23c3c;
  --color-error-600: #b02f2f;
  --color-error-700: #8c2424;
  --color-warning-50: #fff6e5;
  --color-warning-100: #ffe7bd;
  --color-warning-500: #d98a00;
  --color-warning-600: #b06f00;
  --color-info-50: #e9f3fd;
  --color-info-100: #cbe3fa;
  --color-info-500: #2478c8;
  --color-info-600: #1c5fa0;

  /* gray */
  --color-gray-0: #ffffff;
  --color-gray-50: #f7f8fa;
  --color-gray-100: #eef0f3;
  --color-gray-200: #dfe3e8;
  --color-gray-300: #c8cfd7;
  --color-gray-400: #9aa5b1;
  --color-gray-500: #6b7683;
  --color-gray-600: #4c5560;
  --color-gray-700: #363e48;
  --color-gray-800: #242a32;
  --color-gray-900: #14181e;

  /* spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-7: 48px; --space-8: 64px; --space-9: 96px;

  /* radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
  --radius-xl: 24px; --radius-full: 999px;

  /* motion */
  --motion-fast: 140ms;   --motion-base: 260ms;
  --motion-slow: 320ms;   --motion-page: 520ms;
  --motion-shimmer: 1.2s; --motion-spinner: 900ms;
  --ease-standard: cubic-bezier(0.22, 0.9, 0.35, 1);
  --ease-decelerate: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 0.7, 0.2);

  /* typography */
  --font-sans: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: SFMono-Regular, Menlo, Consolas, monospace;
  --text-caption: 500 12px/16px var(--font-sans);
  --text-body-sm: 400 13px/18px var(--font-sans);
  --text-body: 400 15px/22px var(--font-sans);
  --text-body-lg: 400 17px/26px var(--font-sans);
  --text-title-sm: 600 16px/24px var(--font-sans);
  --text-title-md: 650 20px/28px var(--font-sans);
  --text-title-lg: 700 26px/34px var(--font-sans);
  --text-display: 800 40px/48px var(--font-sans);
}

/* Reduced motion: remove transforms & animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`
