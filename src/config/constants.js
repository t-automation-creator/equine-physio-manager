/**
 * Z-Index layering system
 * Use these constants instead of arbitrary z-index values
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  overlay: 90,
  max: 100,
};

/**
 * React Query cache times (in milliseconds)
 */
export const CACHE_TIMES = {
  user: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  appointments: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  treatments: {
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  referenceData: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  invoices: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const LAYOUT = {
  sidebarWidth: 256,
  mobileMenuWidth: 288,
  headerHeight: 64,
  bottomNavHeight: 80,
};

export const MIN_TOUCH_TARGET = 44;
