import { useLayoutEffect } from 'react';

/** Keeps the page behind a modal fixed without moving the reader's scroll position. */
export const useBodyScrollLock = (isLocked: boolean) => {
  useLayoutEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const { documentElement } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      scrollbarGutter: documentElement.style.scrollbarGutter,
    };

    documentElement.style.scrollbarGutter = 'auto';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      documentElement.style.scrollbarGutter = previous.scrollbarGutter;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};
