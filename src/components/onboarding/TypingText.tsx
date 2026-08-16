import { useEffect, useState } from "react";

interface Props {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

/** Lightweight typing-style text reveal for personalized messages. */
const TypingText = ({ text, speed = 28, delay = 0, className = "", onComplete }: Props) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay]);

  const done = count >= text.length;

  useEffect(() => {
    if (done && onComplete) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <span className={className} aria-label={text}>
      {text.slice(0, count)}
      {!done && (
        <span className="inline-block w-[2px] h-[1em] align-middle bg-primary ml-0.5 animate-pulse-soft" />
      )}
    </span>
  );
};

export default TypingText;