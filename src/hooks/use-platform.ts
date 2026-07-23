export function usePlatform() {
  if (typeof navigator === "undefined") return { isAndroid: false, isIOS: false, isDesktop: true };
  const ua = navigator.userAgent;
  return {
    isAndroid: /android/i.test(ua),
    isIOS: /iphone|ipad|ipod/i.test(ua),
    isDesktop: !/android|iphone|ipad|ipod/i.test(ua),
  };
}
