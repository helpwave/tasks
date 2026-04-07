import { TaskPresetsDocument } from '@/api/gql/generated'
import { getParsedDocument } from '../hooks/queryHelpers'

const taskPresetsQuery = getParsedDocument(TaskPresetsDocument)

export const refetchTaskPresetsMutationOptions = {
  refetchQueries: [{ query: taskPresetsQuery }],
  awaitRefetchQueries: true,
}
