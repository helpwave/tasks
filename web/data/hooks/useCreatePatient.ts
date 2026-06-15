import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import {
  CreatePatientDocument,
  type CreatePatientMutation,
  type CreatePatientMutationVariables
} from '@/api/gql/generated'
import { getParsedDocument } from './queryHelpers'
import { useApolloClientOptional } from '@/providers/ApolloProviderWithData'
import { reloadEntityAfterMutation } from '../subscriptions/handler'

type MutateOptions = {
  variables: CreatePatientMutationVariables,
  onCompleted?: (data: CreatePatientMutation) => void,
  onError?: (error: Error) => void,
}

export function useCreatePatient() {
  const client = useApolloClientOptional()
  const clientRef = useRef(client)
  clientRef.current = client
  const [mutateBase] = useMutation<
    CreatePatientMutation,
    CreatePatientMutationVariables
  >(getParsedDocument(CreatePatientDocument))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<CreatePatientMutation['createPatient'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const result = await mutateBase({
          variables: options.variables,
        })
        if (result.data === undefined) {
          throw new Error('Mutation returned no data')
        }
        const created = result.data.createPatient
        if (created?.id && clientRef.current) {
          await reloadEntityAfterMutation(clientRef.current, 'Patient', created.id)
        }
        options.onCompleted?.(result.data)
        return created
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        options.onError?.(err)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [mutateBase]
  )

  return [mutate, { loading, error, data: undefined }] as const
}
