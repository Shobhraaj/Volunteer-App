/**
 * ScrollReveal — A wrapper component that adds a fade-in/slide-up animation
 * when the element enters the viewport.
 */
import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ children, delay = 0, direction = 'up' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    switch (direction) {
      case 'up':    return 'translateY(30px)';
      case 'down':  return 'translateY(-30px)';
      case 'left':  return 'translateX(30px)';
      case 'right': return 'translateX(-30px)';
      default:      return 'translateY(30px)';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `${getTransform()} scale(${isVisible ? 1 : 0.98})`,
        transition: `opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s, 
                     transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s`,
      }}
    >

      {children}
    </div>
  );
}
