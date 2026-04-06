'use client';

import { useRef, useEffect, useState } from 'react';

interface Props {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  paused?: boolean; // true면 스크롤 멈춤
}

export default function MarqueeText({ text, className = '', style, paused = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const [duration, setDuration] = useState(8);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const check = () => {
      const tw = measure.offsetWidth;
      const cw = container.clientWidth;
      setTextWidth(tw);
      const overflows = tw > cw + 5;
      setNeedsScroll(overflows);
      if (overflows) {
        setDuration(Math.max(8, (tw + 64) / 25));
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`} style={style}>
      <span ref={measureRef} className="absolute invisible whitespace-nowrap" aria-hidden>{text}</span>

      {needsScroll ? (
        <div
          className="inline-flex"
          style={{
            animation: `marquee-loop ${duration}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            width: `${(textWidth + 64) * 2}px`,
          }}
        >
          <span className="shrink-0" style={{ width: textWidth, paddingRight: 64 }}>{text}</span>
          <span className="shrink-0" style={{ width: textWidth, paddingRight: 64 }}>{text}</span>
        </div>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}
