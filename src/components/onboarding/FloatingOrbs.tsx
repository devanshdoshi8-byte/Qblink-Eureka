import { motion } from "framer-motion";

/** Subtle floating gradient orbs for visual depth. Pure CSS-friendly, GPU cheap. */
const FloatingOrbs = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <motion.div
      className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
      animate={{ y: [0, 24, 0], x: [0, -12, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"
      animate={{ y: [0, -28, 0], x: [0, 16, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
    <motion.div
      className="absolute -bottom-28 right-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
  </div>
);

export default FloatingOrbs;