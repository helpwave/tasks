import { describe, expect, it } from 'vitest'
import { computePaginationBounds } from './useAccumulatedPagination'

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
