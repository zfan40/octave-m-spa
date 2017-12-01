export function getUrlParam(key) {
  const reg = new RegExp(`[?|&]${key}=([^&]+)`);
  const match = location.search.match(reg);
  return match && match[1];
}

export function getUrlParam1(key) {
  const reg = new RegExp(`[?|&]${key}=([^&]+)`);
  const match = location.search.match(reg);
  return match && match[1];
}
