import { getConfig } from '@/utils/config'
import { GraphQLClient } from 'graphql-request'
import { getUser, login } from '@/api/auth/authService'

const config = getConfig()
const url = config.graphqlEndpoint

const client = new GraphQLClient(url)

export const fetcher = <TData, TVariables extends object | undefined>(
  query: string,
  variables?: TVariables
) => {
  return async (): Promise<TData> => {
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

      formData.append(
        'map',
        JSON.stringify({
          '0': ['variables.file'],
        })
      )

      const file = (variables as any).file as File
      formData.append('0', file)

      const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      })

      if (res.status === 401) {
        await login(window.location.href)
        return new Promise(() => { }) as Promise<TData>
      }

      const json = await res.json()

      if (json.errors) {
        const isUnauthenticated = json.errors.some(
          (error: any) =>
            error.extensions?.code === 'UNAUTHENTICATED' ||
            error.message === 'Not authenticated'
        )

        if (isUnauthenticated) {
          await login(window.location.href)
          return new Promise(() => { }) as Promise<TData>
        }
      }

      if (!res.ok) throw new Error('Upload failed')
      return json.data as TData
    }

    try {
      return await client.request(query, variables, headers)
    } catch (error: any) {
      const isUnauthenticated =
        error.response?.status === 401 ||
        error.response?.errors?.some(
          (err: any) =>
            err.extensions?.code === 'UNAUTHENTICATED' ||
            err.message === 'Not authenticated'
        )

      if (isUnauthenticated) {
        await login(window.location.href)
        return new Promise(() => { }) as Promise<TData>
      }

      throw error
    }
  }
}
