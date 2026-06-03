import { hashString } from '@/utils/hash'

export type SurveyType = 'onboarding' | 'weekly'

/**
 * localStorage keys tracking whether the user already interacted with a survey dialog.
 *
 * - `onboardingCompleted`: timestamp of the interaction with the onboarding survey
 *   (0 = the user has not interacted yet). The onboarding survey is shown only once.
 * - `weeklyLastCompleted`: timestamp of the last interaction with the weekly survey
 *   (0 = never). The weekly survey is shown again once a week has passed.
 *
 * "Interaction" means the user either opened the survey or dismissed the dialog. In
 * both cases we persist it so the popup does not keep annoying the user.
 */
export const surveyStorageKeys = {
  onboardingCompleted: 'onboarding-survey-completed',
  weeklyLastCompleted: 'weekly-survey-last-completed',
} as const

export const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7

/**
 * Builds the survey URL with an anonymized (hashed) user id appended as the `a` query
 * parameter, so survey responses can be de-duplicated without exposing the real user id.
 */
export const buildSurveyUrl = async (baseUrl: string, userId: string): Promise<string> => {
  const hashedUserId = await hashString(userId)
  const url = new URL(baseUrl)
  url.searchParams.set('a', hashedUserId)
  return url.toString()
}

/** Opens the survey in a new tab with the anonymized user id appended. */
export const openSurvey = async (baseUrl: string, userId: string): Promise<void> => {
  const url = await buildSurveyUrl(baseUrl, userId)
  window.open(url, '_blank', 'noopener,noreferrer')
}
