/**
 * Haptic feedback trigger respecting user device support
 * @param {number|number[]} pattern 
 */
export function triggerHaptic(pattern = 80) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // Graceful silent fallback
  }
}
