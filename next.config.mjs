/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Permite leer archivos subidos (.fit/.tcx) en route handlers sin límite bajo.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
