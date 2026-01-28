module.exports = {
  webpack: (config) => Object.assign(config, {
    target: 'electron-renderer',
  }),
  // Disable image optimization to avoid sharp dependency issues with Electron
  images: {
    disableStaticImages: true,
  },
};
