import { Variants, Transition } from "framer-motion";

/**
 * Standard transition presets designed for analyst workflows:
 * Smooth, restrained, fast (no distracting bounce).
 */
export const transitions = {
  fast: { duration: 0.15, ease: [0.2, 0, 0, 1] } as Transition,
  standard: { duration: 0.25, ease: [0.2, 0, 0, 1] } as Transition,
  smooth: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as Transition,
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.fast,
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.standard,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const cardHoverVariants: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -2,
    transition: transitions.fast,
  },
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

export const modalDialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: transitions.fast,
  },
};

export const drawerBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

export const drawerPanelVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    x: "100%",
    transition: transitions.fast,
  },
};

export const modalVariants = {
  backdrop: modalBackdropVariants,
  dialog: modalDialogVariants,
};

export const drawerVariants = {
  backdrop: drawerBackdropVariants,
  drawer: drawerPanelVariants,
};

