'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to reveal elements with smooth slide-up and fade-in when scrolled into view.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Select all child elements with data-reveal, or root if it has data-reveal
    const elements: HTMLElement[] = [];
    if (root.hasAttribute('data-reveal')) {
      elements.push(root);
    }
    elements.push(...Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')));

    if (elements.length === 0) return;

    // If IntersectionObserver is not supported, reveal immediately
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? '0px 0px -40px 0px',
        ...options,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return ref;
}

/**
 * Inline style helper for data-reveal elements with custom delay and distance.
 */
export function reveal(delayMs = 0, distance = '20px'): React.CSSProperties {
  return {
    '--reveal-delay': `${delayMs}ms`,
    '--reveal-distance': distance,
    transitionDelay: `${delayMs}ms`,
  } as React.CSSProperties;
}
