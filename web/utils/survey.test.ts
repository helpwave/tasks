import { describe, expect, it } from 'vitest'
import { hashString } from '@/utils/hash'
import { buildSurveyUrl, ONE_WEEK_MS, surveyStorageKeys } from '@/utils/survey'

describe('survey constants', () => {
  it('exposes the storage keys and a one-week interval', () => {
    expect(surveyStorageKeys.onboardingCompleted).toBe('onboarding-survey-completed')
    expect(surveyStorageKeys.weeklyLastCompleted).toBe('weekly-survey-last-completed')
    expect(ONE_WEEK_MS).toBe(1000 * 60 * 60 * 24 * 7)
  })
})

describe('buildSurveyUrl', () => {
  it('appends an anonymized (hashed) user id as the "a" query parameter', async () => {
    const url = await buildSurveyUrl('https://survey.example/form', 'user-123')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('a')).toBe(await hashString('user-123'))
    expect(parsed.origin + parsed.pathname).toBe('https://survey.example/form')
  })

  it('does not expose the raw user id', async () => {
    const url = await buildSurveyUrl('https://survey.example/form', 'secret-user')
    expect(url).not.toContain('secret-user')
  })

  it('preserves existing query parameters on the base url', async () => {
    const url = await buildSurveyUrl('https://survey.example/form?lang=de', 'user-123')
    const parsed = new URL(url)
    expect(parsed.searchParams.get('lang')).toBe('de')
    expect(parsed.searchParams.get('a')).toBeTruthy()
  })
})
