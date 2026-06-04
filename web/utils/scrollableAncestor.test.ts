import { describe, expect, it } from 'vitest'
import { isScrollableOverflowY } from './scrollableAncestor'

describe('isScrollableOverflowY', () => {
  it('treats auto, scroll and overlay as scrollable', () => {
    expect(isScrollableOverflowY('auto')).toBe(true)
    expect(isScrollableOverflowY('scroll')).toBe(true)
    expect(isScrollableOverflowY('overlay')).toBe(true)
  })

  it('treats visible, hidden and clip as non-scrollable', () => {
    expect(isScrollableOverflowY('visible')).toBe(false)
    expect(isScrollableOverflowY('hidden')).toBe(false)
    expect(isScrollableOverflowY('clip')).toBe(false)
    expect(isScrollableOverflowY('')).toBe(false)
  })
})
