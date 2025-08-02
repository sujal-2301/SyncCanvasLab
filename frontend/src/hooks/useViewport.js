import { useState, useEffect } from 'react';

export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    isLargeScreen: window.innerWidth >= 1280,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isLargeScreen: width >= 1280,
      });

      // Update CSS custom properties for dynamic sizing
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
    };

    // Set initial values
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
};

// Utility function to get optimal container size based on viewport
export const getOptimalContainerSize = (width, height) => {
  const aspectRatio = width / height;
  
  if (width < 480) {
    // Very small mobile
    return {
      maxWidth: '95vw',
      padding: '0.5rem',
      fontSize: '0.875rem',
    };
  } else if (width < 768) {
    // Mobile
    return {
      maxWidth: '90vw',
      padding: '1rem',
      fontSize: '1rem',
    };
  } else if (width < 1024) {
    // Tablet
    return {
      maxWidth: '85vw',
      padding: '1.5rem',
      fontSize: '1.125rem',
    };
  } else if (width < 1280) {
    // Small desktop
    return {
      maxWidth: '28rem',
      padding: '2rem',
      fontSize: '1.25rem',
    };
  } else if (width < 1536) {
    // Large desktop
    return {
      maxWidth: '32rem',
      padding: '2.5rem',
      fontSize: '1.375rem',
    };
  } else {
    // Extra large desktop
    return {
      maxWidth: '36rem',
      padding: '3rem',
      fontSize: '1.5rem',
    };
  }
};

// Utility function to calculate optimal spacing
export const getOptimalSpacing = (viewport) => {
  const { width, height } = viewport;
  const minDimension = Math.min(width, height);
  
  return {
    xs: Math.max(4, minDimension * 0.01),
    sm: Math.max(8, minDimension * 0.02),
    md: Math.max(16, minDimension * 0.03),
    lg: Math.max(24, minDimension * 0.04),
    xl: Math.max(32, minDimension * 0.05),
  };
}; 