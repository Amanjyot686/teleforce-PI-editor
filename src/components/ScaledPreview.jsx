import { useLayoutEffect, useRef, useState } from 'react';

const PAGE_W = 794;

// Scales the fixed-width A4 page to fit the available preview width.
export default function ScaledPreview({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(1123);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const measure = () => {
      setScale(Math.min(1.25, outer.clientWidth / PAGE_W));
      setHeight(inner.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="preview-outer" ref={outerRef}>
      <div className="preview-frame" style={{ width: PAGE_W * scale, height: height * scale }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PAGE_W }}>
          {children}
        </div>
      </div>
    </div>
  );
}
