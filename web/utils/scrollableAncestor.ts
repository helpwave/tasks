/**
 * Helpers for locating the scroll container an element actually lives in.
 *
 * Infinite-scroll relies on an IntersectionObserver. When `root` is left as the
 * viewport but the content is rendered inside a nested `overflow-y-auto`
 * container (as the app shell does in `Page`), intermediate scroll containers
 * clip the observed target, so a generous `rootMargin` lookahead is silently
 * ignored — the sentinel only intersects once it reaches the very bottom.
 * Observing against the real scroll container restores the "load before the
 * bottom is reached" behaviour.
 */

/** A computed `overflow-y` value that lets the element scroll its content. */
export function isScrollableOverflowY(overflowY: string): boolean {
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
}

/**
 * Walks up from `node` and returns the nearest ancestor that scrolls vertically.
 * Stops at (and ignores) the document root, where `root: null` (the viewport) is
 * already the correct IntersectionObserver root. Returns `null` when no nested
 * scroll container exists, which the caller should treat as "use the viewport".
 */
export function findScrollableAncestor(node: Element | null): HTMLElement | null {
  if (typeof window === 'undefined') return null
  let current = node?.parentElement ?? null
  while (current && current !== document.body && current !== document.documentElement) {
    if (isScrollableOverflowY(window.getComputedStyle(current).overflowY)) {
      return current
    }
    current = current.parentElement
  }
  return null
}
