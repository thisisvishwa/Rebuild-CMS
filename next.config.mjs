/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow the sandbox/cloud preview origins plus common local dev origins so the
  // live preview and local development both work without origin rejections.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.e2b.app",
    "*.vercel.app",
    "*.onrender.com",
    "*.railway.app",
    "*.fly.dev",
  ],
  experimental: {
    // Keep server actions off by default for a smaller, more predictable surface.
    serverActions: {
      bodySizeLimit: "1mb",
      enabled: false,
    },
  },
  async headers() {
    // Security headers: strict transport, framing protection, MIME sniffing,
    // secure referrer and a strict Content-Security-Policy for the front end.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.paypal.com https://www.paypalobjects.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.razorpay.com https://api-m.paypal.com https://www.paypal.com",
              "frame-src 'self' https://checkout.razorpay.com https://www.paypal.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
