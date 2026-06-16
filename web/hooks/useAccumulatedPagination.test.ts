import { describe, expect, it } from 'vitest'
import {
  computePaginationBounds,
  getContiguousLoadedThrough,
  materializePages,
  mergePagesById,
  mergePagesContiguousById
} from './useAccumulatedPagination'

const PAGE_SIZE = 25

describe('computePaginationBounds', () => {
  it('reports no more pages while the total is still unknown', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: undefined,
      pageSize: PAGE_SIZE,
      pageIndex: 0,
      accumulatedLength: 0,
    })
    expect(lastAvailablePage).toBeUndefined()
    expect(hasMore).toBe(false)
  })

  it('hides "load more" when there is no content at all', () => {
    const { hasMore } = computePaginationBounds({
      totalCount: 0,
      pageSize: PAGE_SIZE,
      pageIndex: 0,
      accumulatedLength: 0,
    })
    expect(hasMore).toBe(false)
  })

  it('offers more pages while earlier pages are loaded', () => {
    expect(computePaginationBounds({
      totalCount: 60, pageSize: PAGE_SIZE, pageIndex: 0, accumulatedLength: 25,
      contiguousLoadedThrough: 0,
    }).hasMore).toBe(true)
    expect(computePaginationBounds({
      totalCount: 60, pageSize: PAGE_SIZE, pageIndex: 1, accumulatedLength: 50,
      contiguousLoadedThrough: 1,
    }).hasMore).toBe(true)
  })

  it('stops once the last page has been loaded', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: 60, pageSize: PAGE_SIZE, pageIndex: 2, accumulatedLength: 60,
      contiguousLoadedThrough: 2,
    })
    expect(lastAvailablePage).toBe(2)
    expect(hasMore).toBe(false)
  })

  it('keeps hasMore true when accumulated is short but page index reached the end', () => {
    const { hasMore } = computePaginationBounds({
      totalCount: 53,
      pageSize: PAGE_SIZE,
      pageIndex: 2,
      accumulatedLength: 28,
      contiguousLoadedThrough: -1,
    })
    expect(hasMore).toBe(true)
  })

  it('keeps hasMore true when a gap exists before the current page index', () => {
    const { hasMore } = computePaginationBounds({
      totalCount: 53,
      pageSize: PAGE_SIZE,
      pageIndex: 2,
      accumulatedLength: 0,
      contiguousLoadedThrough: -1,
    })
    expect(hasMore).toBe(true)
  })

  it('does not loop when the page index is past the end of a shrunken result set', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: 20,
      pageSize: PAGE_SIZE,
      pageIndex: 26,
      accumulatedLength: 0,
      contiguousLoadedThrough: -1,
    })
    expect(lastAvailablePage).toBe(0)
    expect(hasMore).toBe(false)
  })

  it('treats a non-positive page size as an unknown bound', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: 20, pageSize: 0, pageIndex: 0, accumulatedLength: 0,
    })
    expect(lastAvailablePage).toBeUndefined()
    expect(hasMore).toBe(true)
  })
})

describe('mergePagesById', () => {
  it('concatenates pages in order', () => {
    const merged = mergePagesById([
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'c' }],
    ])
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('skips not-yet-loaded (undefined) pages without losing later pages', () => {
    const merged = mergePagesById([
      [{ id: 'a' }],
      undefined,
      [{ id: 'c' }],
    ])
    expect(merged.map(x => x.id)).toEqual(['a', 'c'])
  })

  it('keeps the first occurrence when an id appears on multiple pages', () => {
    const first = { id: 'a', v: 1 }
    const duplicate = { id: 'a', v: 2 }
    const merged = mergePagesById([[first], [duplicate, { id: 'b', v: 3 }]])
    expect(merged).toEqual([first, { id: 'b', v: 3 }])
  })

  it('reflects fresh item references from the cache (live updates)', () => {
    const stale = { id: 'a', name: 'old' }
    const fresh = { id: 'a', name: 'new' }
    expect(mergePagesById([[stale]])[0]).toBe(stale)
    expect(mergePagesById([[fresh]])[0]).toBe(fresh)
  })
})

describe('mergePagesContiguousById', () => {
  it('concatenates pages in order when all are present', () => {
    const merged = mergePagesContiguousById([
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'c' }],
    ])
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('stops at the first missing page and does not include later pages', () => {
    const page1 = Array.from({ length: 25 }, (_, i) => ({ id: `p1-${i}` }))
    const page2 = Array.from({ length: 3 }, (_, i) => ({ id: `p2-${i}` }))
    const merged = mergePagesContiguousById([undefined, page1, page2])
    expect(merged).toEqual([])
  })

  it('stops at a gap in the middle', () => {
    const merged = mergePagesContiguousById([
      [{ id: 'a' }],
      undefined,
      [{ id: 'c' }],
    ])
    expect(merged.map(x => x.id)).toEqual(['a'])
  })
})

describe('getContiguousLoadedThrough', () => {
  it('returns -1 when page 0 is missing', () => {
    const through = getContiguousLoadedThrough(2, (p) => {
      if (p === 0) return undefined
      return [{ id: `p${p}` }]
    })
    expect(through).toBe(-1)
  })

  it('returns the highest contiguous loaded page index', () => {
    const pages = new Map<number, Array<{ id: string }>>([
      [0, [{ id: 'a' }]],
      [1, [{ id: 'b' }]],
    ])
    const through = getContiguousLoadedThrough(2, (p) => pages.get(p))
    expect(through).toBe(1)
  })
})

describe('materializePages', () => {
  it('keeps earlier pages when a later page is added (one continuous list)', () => {
    const lastPages = new Map<number, Array<{ id: string }>>()
    materializePages([[{ id: 'a' }, { id: 'b' }]], lastPages)
    const merged = materializePages(
      [[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]],
      lastPages
    )
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not drop an earlier page that momentarily reads as undefined', () => {
    const lastPages = new Map<number, Array<{ id: string }>>()
    materializePages([[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]], lastPages)
    const merged = materializePages([undefined, [{ id: 'c' }]], lastPages)
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not include later pages when page 0 was never loaded', () => {
    const lastPages = new Map<number, Array<{ id: string }>>()
    const page1 = Array.from({ length: 25 }, (_, i) => ({ id: `p1-${i}` }))
    const page2 = Array.from({ length: 3 }, (_, i) => ({ id: `p2-${i}` }))
    const merged = materializePages([undefined, page1, page2], lastPages)
    expect(merged).toEqual([])
  })

  it('includes all pages once page 0 arrives after a gap repair', () => {
    const lastPages = new Map<number, Array<{ id: string }>>()
    const page0 = Array.from({ length: 25 }, (_, i) => ({ id: `p0-${i}` }))
    const page1 = Array.from({ length: 25 }, (_, i) => ({ id: `p1-${i}` }))
    const page2 = Array.from({ length: 3 }, (_, i) => ({ id: `p2-${i}` }))
    materializePages([undefined, page1, page2], lastPages)
    const merged = materializePages([page0, page1, page2], lastPages)
    expect(merged).toHaveLength(53)
  })

  it('propagates genuine removals (a defined empty page is authoritative)', () => {
    const lastPages = new Map<number, Array<{ id: string }>>()
    materializePages([[{ id: 'a' }], [{ id: 'b' }]], lastPages)
    expect(materializePages([[{ id: 'a' }], []], lastPages).map(x => x.id)).toEqual(['a'])
    expect(materializePages([[{ id: 'a' }], undefined], lastPages).map(x => x.id)).toEqual(['a'])
  })

  it('reflects updated items on an already-known page', () => {
    const lastPages = new Map<number, Array<{ id: string, v: number }>>()
    materializePages([[{ id: 'a', v: 1 }]], lastPages)
    const merged = materializePages([[{ id: 'a', v: 2 }]], lastPages)
    expect(merged).toEqual([{ id: 'a', v: 2 }])
  })
})
