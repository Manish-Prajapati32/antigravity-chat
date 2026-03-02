/**
 * Unified Motion System — Antigravity Chat
 * All transitions and animation variants live here.
 */

export const DURATIONS = {
    hover: 0.15,
    micro: 0.25,
    modal: 0.35,
    route: 0.5,
};

export const EASINGS = {
    smooth: [0.4, 0, 0.2, 1],
    spring: { type: 'spring', stiffness: 320, damping: 28 },
    springSnappy: { type: 'spring', stiffness: 500, damping: 35 },
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
};

/** Fade in from opacity 0 */
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATIONS.micro, ease: EASINGS.smooth },
};

/** Slide up + fade */
export const slideUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: DURATIONS.micro, ease: EASINGS.smooth },
};

/** Slide in from right (for modals/panels) */
export const slideInRight = {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 32 },
    transition: { duration: DURATIONS.modal, ease: EASINGS.smooth },
};

/** Scale popup (for dropdowns, pickers) */
export const scaleIn = {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.92 },
    transition: EASINGS.springSnappy,
};

/** Message bubble entrance */
export const messagePop = {
    initial: { opacity: 0, y: 12, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: EASINGS.spring,
};

/** Route transition wrapper */
export const routeTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: DURATIONS.route, ease: EASINGS.smooth },
};

/** Stagger children (for lists) */
export const staggerContainer = {
    animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATIONS.micro, ease: EASINGS.smooth },
};

/** Presence pill transition */
export const presencePill = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: DURATIONS.hover, ease: EASINGS.smooth },
};
