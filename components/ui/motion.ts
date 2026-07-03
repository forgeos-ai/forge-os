export const easePremium = [0.25, 0.1, 0.25, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: easePremium },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: { y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easePremium },
  },
};
