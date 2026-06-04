import { hashString } from '@/utils/hash'

export type SurveyType = 'onboarding' | 'weekly'

export const surveyStorageKeys = {
  onboardingCompleted: 'onboarding-survey-completed',
  weeklyLastCompleted: 'weekly-survey-last-completed',
} as const

export const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

export const buildSurveyUrl = async (baseUrl: string, userId: string): Promise<string> => {
  const hashedUserId = await hashString(userId)
  const url = new URL(baseUrl)
  url.searchParams.set('a', hashedUserId)
  return url.toString()
}

export const openSurvey = async (baseUrl: string, userId: string): Promise<void> => {
  const url = await buildSurveyUrl(baseUrl, userId)
  window.open(url, '_blank', 'noopener,noreferrer')
}
