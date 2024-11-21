/* eslint-disable no-restricted-globals */

// Add basic service worker setup

import { precacheAndRoute } from 'workbox-precaching';

// Ensure self.__WB_MANIFEST is correctly referenced
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Add a call to skipWaiting here if needed
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Add a call to claim clients here if needed
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  // Add fetch event handling here if needed
});

/* eslint-enable no-restricted-globals */
