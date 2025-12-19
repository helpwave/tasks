import { getConfig } from '@/utils/config'
import { GraphQLClient } from 'graphql-request'
import { getUser, login, removeUser } from '@/api/auth/authService'

const config = getConfig()
const url = config.graphqlEndpoint

const client = new GraphQLClient(url)

const handleError = async (error: any) => {
  const isAuthenticationServerUnavailable = error?.response?.status === 400 ||
                                            error?.status === 400

  if (isAuthenticationServerUnavailable) {
    throw error
  }
  
  const responseData = error?.response?.data || error?.response
  const errorObject = typeof responseData === 'string' ? JSON.parse(responseData) : responseData

  const isInvalidGrant =
    errorObject?.error === 'invalid_grant' &&
    errorObject?.error_description === 'Token is not active'

  const isUnauthorized = error?.response?.status === 401

  if (isInvalidGrant || isUnauthorized) {
    await removeUser()
    await login()
    throw new Error('Session expired')
  }
}

export const fetcher = <TData, TVariables extends object | undefined>(
  query: string,
  variables?: TVariables
) => {
  return async (): Promise<TData> => {
    try {
      const user = await getUser()
      const token = user?.access_token
      const headers: HeadersInit = {}

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const hasFile =
        variables &&
        Object.values(variables).some((v) => v instanceof File || v instanceof Blob)

      if (hasFile) {
        const formData = new FormData()
        formData.append(
          'operations',
          JSON.stringify({
            query,
            variables: { ...variables as any, file: null },
          })
        )
        formData.append('map', JSON.stringify({ '0': ['variables.file'] }))

        const file = (variables as any).file as File
        formData.append('0', file)

        const res = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData,
        })

        if (!res.ok) {
          try {
            const errorBody = await res.json()
            await handleError({ response: errorBody })
          } catch (e) {
            if (e instanceof Error && e.message === 'Session expired') throw e
          }
          throw new Error('Upload failed')
        }

        const json = await res.json()
        return json.data as TData
      }

      return await client.request(query, variables, headers)
    } catch (error) {
      await handleError(error)
      throw error
    }
  }
}
