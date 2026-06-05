import { describe, expect, it } from 'vitest'
import {
  buildListLayoutStorageKey,
  parseStoredLayout,
  resolveListRouteId
} from './useListLayoutPreference'

describe('parseStoredLayout', () => {
  it('accepts the two known layouts', () => {
    expect(parseStoredLayout('table')).toBe('table')
    expect(parseStoredLayout('card')).toBe('card')
  })

  it('rejects unknown, empty or missing values', () => {
    expect(parseStoredLayout('grid')).toBeNull()
    expect(parseStoredLayout('')).toBeNull()
    expect(parseStoredLayout(null)).toBeNull()
    expect(parseStoredLayout(undefined)).toBeNull()
  })
})

describe('resolveListRouteId', () => {
  it('prefers an explicit saved-view id', () => {
    expect(resolveListRouteId({ uid: 'from-route' }, 'saved-view')).toBe('saved-view')
  })

  it('falls back to the uid then id route params', () => {
    expect(resolveListRouteId({ uid: 'view-123' })).toBe('view-123')
    expect(resolveListRouteId({ id: 'loc-7' })).toBe('loc-7')
  })

  it('uses a shared root bucket for plain routes', () => {
    expect(resolveListRouteId({})).toBe('root')
  })

  it('ignores array-valued and empty params', () => {
    expect(resolveListRouteId({ uid: [] as unknown as string[] })).toBe('root')
    expect(resolveListRouteId({ uid: '' })).toBe('root')
  })
})

describe('buildListLayoutStorageKey', () => {
  it('namespaces the key by entity, route and view id', () => {
    expect(buildListLayoutStorageKey({
      entity: 'tasks',
      disabled: false,
      pathname: '/view/[uid]',
      routeId: 'abc',
    })).toBe('tasks:/view/[uid]:abc')

    expect(buildListLayoutStorageKey({
      entity: 'patients',
      disabled: false,
      pathname: '/patients',
      routeId: 'root',
    })).toBe('patients:/patients:root')
  })

  it('keeps tasks and patients on the same route distinct', () => {
    const tasks = buildListLayoutStorageKey({ entity: 'tasks', disabled: false, pathname: '/', routeId: 'root' })
    const patients = buildListLayoutStorageKey({ entity: 'patients', disabled: false, pathname: '/', routeId: 'root' })
    expect(tasks).not.toBe(patients)
  })

  it('returns null when persistence is disabled (embedded lists)', () => {
    expect(buildListLayoutStorageKey({
      entity: 'tasks',
      disabled: true,
      pathname: '/',
      routeId: 'root',
    })).toBeNull()
  })
})
