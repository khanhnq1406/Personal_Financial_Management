import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy compatibility (will be phased out)
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: "#2563EB", // Mapped to primary-600 for backward compatibility
        fg: "#F8FAFC", // Mapped to neutral-50
        hgreen: "#3B82F6", // Mapped to primary-500
        lred: "#DC2626", // Mapped to danger-600
        hover: "#E2E8F0", // Mapped to neutral-200
        modal: "rgba(0, 0, 0, 0.5)",

        // PRIMARY - Deep Professional Blue (trust, stability)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // SECONDARY - Warm Trust Gold (success, value, premium features)
        secondary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // SUCCESS - Positive Green (gains, income, positive trends)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },

        // DANGER - Alert Red (losses, expenses, warnings)
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },

        // NEUTRAL - Professional Gray Scale
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        // CHART COLORS - Data Visualization Palette
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

      // Typography Scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        '5xl': ['3rem', { lineHeight: '1', fontWeight: '800' }],
        'financial-sm': ['1rem', { lineHeight: '1.5rem', fontWeight: '600', letterSpacing: '0.025em' }],
        'financial-md': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600', letterSpacing: '0.025em' }],
        'financial-lg': ['1.5rem', { lineHeight: '2rem', fontWeight: '700', letterSpacing: '0.025em' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // Spacing & Touch Targets
      spacing: {
        '11': '2.75rem',  // 44px - minimum touch target
        '12': '3rem',     // 48px - comfortable touch
        '14': '3.5rem',   // 56px - large touch (primary actions)
        'mobile-xs': '0.5rem',
        'mobile-sm': '0.75rem',
        'mobile-md': '1rem',
        'mobile-lg': '1.5rem',
        'desktop-sm': '1rem',
        'desktop-md': '1.5rem',
        'desktop-lg': '2rem',
        'desktop-xl': '3rem',
      },

      // Box Shadow System
      boxShadow: {
        'card': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.12)',
        'card-active': '0 1px 4px rgba(15, 23, 42, 0.06)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 8px 16px rgba(0, 0, 0, 0.12)',
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.5)',
      },

      // Keep legacy dropShadow for backward compatibility
      dropShadow: {
        round: "0px 0px 3px rgb(0 0 0 / 0.4)",
      },

      // Border Radius
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        'full': '9999px',
      },

      // Transitions
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // Grid Breakpoints (standard Tailwind)
      screens: {
        'sm': '640px',   // Landscape phones
        'md': '768px',   // Tablets
        'lg': '1024px',  // Laptops
        'xl': '1280px',  // Desktops
        '2xl': '1536px', // Large desktops
      },
    },
  },
  plugins: [],
} satisfies Config;
