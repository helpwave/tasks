export function isScrollableOverflowY(overflowY: string): boolean {
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
}

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
