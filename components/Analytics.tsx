'use client';

import { useEffect } from 'react';
import { app } from '@/firebase';
import { getAnalytics, isSupported } from 'firebase/analytics';

const Analytics = () => {
  useEffect(() => {
    const initializeAnalytics = async () => {
      const supported = await isSupported();
      if (supported) {
        getAnalytics(app);
      }
    };

    initializeAnalytics();
  }, []);

  return null;
};

export default Analytics;