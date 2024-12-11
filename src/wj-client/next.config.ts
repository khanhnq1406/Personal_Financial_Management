import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
module.exports = {
  webpackDevMiddleware: (config: any) => {
    config.watchOptions = {
      poll: 800,
      aggregateTimeout: 300,
    };
    return config;
  },
};
export default nextConfig;
