const adminFrameProtectionHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  }
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/admin",
        headers: adminFrameProtectionHeaders
      },
      {
        source: "/admin/:path*",
        headers: adminFrameProtectionHeaders
      }
    ];
  }
};

export default nextConfig;
