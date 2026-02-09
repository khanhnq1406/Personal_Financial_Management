import type { Config } from "tailwindcss";

/**
 * WealthJourney - Optimized Tailwind Configuration
 *
 * This configuration implements the modern fintech design system
 * with professional colors, enhanced spacing, and trust-building elements.
 *
 * Migration Guide:
 * 1. Replace current tailwind.config.ts with this file
 * 2. Update component color references (bg → primary-600, hgreen → primary-500)
 * 3. Test all pages for visual consistency
 * 4. Update custom CSS variables in globals.css if needed
 */

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ===========================
      // COLOR SYSTEM
      // ===========================
      colors: {
        // LEGACY SUPPORT (map to new colors for gradual migration)
        bg: "#3B82F6",        // Maps to primary-600
        hgreen: "#2563EB",    // Maps to primary-700 (hover)
        fg: "#F8FAFC",        // Maps to neutral-50
        lred: "#DC2626",      // Maps to danger-600
        hover: "#E2E8F0",     // Maps to neutral-200
        modal: "rgba(0, 0, 0, 0.5)",

        // NEW COLOR SYSTEM
        // Primary - Deep Professional Blue (trust, stability)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',    // Main brand color
          600: '#2563EB',    // Primary buttons
          700: '#1D4ED8',    // Hover states
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Secondary - Warm Trust Gold (success, value, premium)
        secondary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',    // Main gold
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // Success - Positive Green (gains, income)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',    // Main success color
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },

        // Danger - Alert Red (losses, expenses)
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',    // Main error color
          600: '#DC2626',    // Matches current lred
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },

        // Neutral - Professional Gray Scale
        neutral: {
          50: '#F8FAFC',     // Page background (replaces fg)
          100: '#F1F5F9',    // Card backgrounds
          200: '#E2E8F0',    // Borders
          300: '#CBD5E1',    // Muted borders
          400: '#94A3B8',    // Placeholder text
          500: '#64748B',    // Secondary text
          600: '#475569',    // Body text
          700: '#334155',    // Headings
          800: '#1E293B',    // Dark headings
          900: '#0F172A',    // Almost black
        },

        // Chart Colors - Data Visualization
        chart: {
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          pink: '#EC4899',
          rose: '#F43F5E',
          orange: '#F97316',
          amber: '#F59E0B',
          yellow: '#EAB308',
          lime: '#84CC16',
          green: '#22C55E',
          emerald: '#10B981',
          teal: '#14B8A6',
          cyan: '#06B6D4',
          sky: '#0EA5E9',
        },
      },

      // ===========================
      // TYPOGRAPHY
      // ===========================
      fontSize: {
        // Body text
        'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px

        // Headings
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1', fontWeight: '800' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1', fontWeight: '800' }],        // 60px

        // Financial data (slightly larger, semibold, letter-spaced)
        'financial-sm': ['1rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '0.025em' }],
        'financial-md': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600', letterSpacing: '0.025em' }],
        'financial-lg': ['1.5rem', { lineHeight: '2rem', fontWeight: '700', letterSpacing: '0.025em' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // ===========================
      // SPACING & SIZING
      // ===========================
      spacing: {
        // Touch targets (WCAG compliance)
        '11': '2.75rem',   // 44px - minimum touch target
        '12': '3rem',      // 48px - comfortable touch
        '14': '3.5rem',    // 56px - large touch target
        '18': '4.5rem',    // 72px - extra large
      },

      // ===========================
      // SHADOWS & ELEVATION
      // ===========================
      boxShadow: {
        // Cards
        'card': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.12)',
        'card-active': '0 1px 4px rgba(15, 23, 42, 0.06)',

        // Modals and overlays
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

        // Floating elements (FAB, tooltips)
        'floating': '0 8px 16px rgba(0, 0, 0, 0.12)',

        // Focus states
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.5)',

        // Legacy support (replace drop-shadow-round)
        'round': '0 2px 8px rgba(15, 23, 42, 0.08)',
      },

      dropShadow: {
        'round': '0 2px 8px rgba(15, 23, 42, 0.08)',
      },

      // ===========================
      // BORDER RADIUS
      // ===========================
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',      // 4px
        'DEFAULT': '0.5rem',  // 8px (current rounded-md)
        'md': '0.75rem',      // 12px
        'lg': '1rem',         // 16px
        'xl': '1.5rem',       // 24px
        'full': '9999px',     // Pills
      },

      // ===========================
      // TRANSITIONS & ANIMATIONS
      // ===========================
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ===========================
      // BREAKPOINTS (Keep Current)
      // ===========================
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // ===========================
      // ANIMATIONS
      // ===========================
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },

      // ===========================
      // CHART COLORS
      // ===========================
      backgroundColor: {
        'chart-pastel': {
          1: '#66bfff',
          2: '#95a8ff',
          3: '#66ffcc',
          4: '#95e6ff',
          5: '#d1a9ff',
          6: '#ffa3d7',
          7: '#ffb984',
          8: '#ffd966',
          9: '#c4ff66',
          10: '#88e5a3',
        },
      },
    },
  },
  plugins: [
    // Add Tailwind plugins here
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // require('@tailwindcss/container-queries'),
  ],
};

export default config;
