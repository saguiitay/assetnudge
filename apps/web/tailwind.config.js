// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Brand palette
        primary: {
          DEFAULT: '#F97316', // vivid orange (rocket flames)
          light: '#FB923C',
          dark: '#EA580C',
        },
        secondary: {
          DEFAULT: '#0EA5E9', // teal-blue arrow accent
          light: '#38BDF8',
          dark: '#0369A1',
        },
        background: {
          DEFAULT: '#0B1120', // deep navy cosmic background
          light: '#1E293B',   // dark slate for cards/panels
        },
        text: {
          DEFAULT: '#E2E8F0', // light gray text
          muted: '#94A3B8',
          highlight: '#FFFFFF',
        },
        accent: {
          yellow: '#FACC15', // spark/star highlights
          glow: '#FBBF24',   // warm glow effects
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Poppins', 'Inter', 'ui-sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(251, 191, 36, 0.4)',
        neon: '0 0 18px rgba(14, 165, 233, 0.6)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #F97316, #0EA5E9)',
        'gradient-dark': 'linear-gradient(180deg, #0B1120, #1E293B)',
      },
    },
  },
};
