/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@cloudscape-design/components",
    "@cloudscape-design/component-toolkit",
    "@cloudscape-design/design-tokens",
    "@cloudscape-design/global-styles",
  ],
};

export default nextConfig;
