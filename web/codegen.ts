import type { CodegenConfig } from '@graphql-codegen/cli'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { getConfig } from './utils/config'

const schemaFromBackend = path.join(__dirname, '../backend/schema.graphql')
const schemaFromWeb = path.join(__dirname, 'schema.graphql')
const schema = fs.existsSync(schemaFromBackend)
  ? schemaFromBackend
  : fs.existsSync(schemaFromWeb)
    ? schemaFromWeb
    : getConfig().graphqlEndpoint

const config: CodegenConfig = {
  schema,
  documents: 'api/graphql/**/*.graphql',
  generates: {
    'api/gql/generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
}

export default config
