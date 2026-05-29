import type { NextConfig } from 'next';

const FIREBASE_HOSTS = [
  'https://*.firebaseapp.com',
  'https://*.firebaseio.com',
  'https://*.googleapis.com',
  'https://apis.google.com',
  'https://www.gstatic.com',
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://firebasestorage.googleapis.com',
];

const isDev = process.env.NODE_ENV !== 'production';

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  // 'unsafe-eval' is only needed for React Refresh / Turbopack HMR in dev
  ...(isDev ? ["'unsafe-eval'"] : []),
  'https://fonts.googleapis.com',
  ...FIREBASE_HOSTS,
].join(' ');

const cspDirectives = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' ${FIREBASE_HOSTS.join(' ')} wss://*.firebaseio.com`,
  "frame-src 'self' https://*.firebaseapp.com https://apis.google.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
];

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Tree-shake Phosphor so only the icons actually imported are bundled,
  // keeping build/compile fast despite the library's thousands of glyphs.
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
