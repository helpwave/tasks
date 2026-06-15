import { describe, expect, it } from 'vitest'
import { paginatedListItemKey, samePaginatedListItems } from '@/utils/paginatedListItemKey'

describe('paginatedListItemKey', () => {
  it('changes when birthdate changes', () => {
    const before = { id: 'patient-1', name: 'Jane Doe', birthdate: '1990-01-01' }
    const after = { id: 'patient-1', name: 'Jane Doe', birthdate: '1991-02-02' }
    expect(samePaginatedListItems([before], [after])).toBe(false)
  })

  it('changes when a property scalar value changes even if the object reference is stable', () => {
    const item = {
      id: 'patient-1',
      name: 'Jane Doe',
      properties: [
        {
          definition: { id: 'def-1' },
          dateValue: '2003-03-03',
        },
      ],
    }
    const sameRef = item
    const updated = {
      ...item,
      properties: [
        {
          definition: { id: 'def-1' },
          dateValue: '2004-04-04',
        },
      ],
    }
    expect(paginatedListItemKey(item)).not.toBe(paginatedListItemKey(updated))
    expect(samePaginatedListItems([item], [sameRef])).toBe(true)
    expect(samePaginatedListItems([item], [updated])).toBe(false)
  })
})

describe('samePaginatedListItems', () => {
  it('treats lists with identical content keys as equal regardless of reference identity', () => {
    const a = { id: '1', title: 'Task', properties: [] }
    const b = { id: '1', title: 'Task', properties: [] }
    expect(samePaginatedListItems([a], [b])).toBe(true)
  })
})
