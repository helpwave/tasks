import type { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'
import { getConfig } from './utils/config'

const config: CodegenConfig = {
  schema: getConfig().graphqlEndpoint,
  documents: 'api/graphql/**/*.graphql',
  generates: {
    'api/gql/generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
}

export default config
