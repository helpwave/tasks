import { describe, expect, it } from 'vitest'
import { computePaginationBounds, mergePagesById } from './useAccumulatedPagination'

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
    }).hasMore).toBe(true)
    expect(computePaginationBounds({
      totalCount: 60, pageSize: PAGE_SIZE, pageIndex: 1, accumulatedLength: 50,
    }).hasMore).toBe(true)
  })

  it('stops once the last page has been loaded', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: 60, pageSize: PAGE_SIZE, pageIndex: 2, accumulatedLength: 60,
    })
    expect(lastAvailablePage).toBe(2)
    expect(hasMore).toBe(false)
  })

  it('does not loop when the page index is past the end of a shrunken result set', () => {
    const { lastAvailablePage, hasMore } = computePaginationBounds({
      totalCount: 20,
      pageSize: PAGE_SIZE,
      pageIndex: 26,
      accumulatedLength: 0,
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
