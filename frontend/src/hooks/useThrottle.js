import { useRef } from "react";

// Custom hook for throttling function calls
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  const timeoutRef = useRef(null);

  return (...args) => {
    const now = Date.now();

    if (now - lastCall.current >= delay) {
      // Execute immediately if enough time has passed
      lastCall.current = now;
      callback(...args);
    } else {
      // Schedule execution for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  };
};
