module.exports = function cleanUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch (err) {
    return null;
  }
};
