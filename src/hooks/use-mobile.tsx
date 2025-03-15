
import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on first load
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return isMobile;
}
