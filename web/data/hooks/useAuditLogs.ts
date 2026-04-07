import {
  GetAuditLogsDocument,
  type GetAuditLogsQuery,
  type GetAuditLogsQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseAuditLogsResult = {
  data: GetAuditLogsQuery | undefined,
  loading: boolean,
  error: Error | undefined,
  refetch: () => void,
}

export function useAuditLogs(
  variables: GetAuditLogsQueryVariables,
  options?: { skip?: boolean }
): UseAuditLogsResult {
  const result = useQueryWhenReady<
    GetAuditLogsQuery,
    GetAuditLogsQueryVariables
  >(GetAuditLogsDocument, variables, options)
  return result
}
