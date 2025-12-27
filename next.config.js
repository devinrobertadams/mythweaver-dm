const withPWA = require("next-pwa")({
  dest: "public",
  disable: false
});

module.exports = withPWA({
  reactStrictMode: true
});
