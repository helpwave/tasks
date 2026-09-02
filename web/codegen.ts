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

const sharedConfig = {
  scalars: {
    ID: { input: 'string', output: 'string' },
    Date: 'any',
    DateTime: 'any',
  },
  skipTypename: false,
  avoidOptionals: false,
}

const config: CodegenConfig = {
  schema,
  documents: 'api/graphql/**/*.graphql',
  generates: {
    'api/gql/types.ts': {
      plugins: ['typescript'],
      config: sharedConfig,
    },
    'api/gql/generated.ts': {
      plugins: [
        { add: { content: "export * from './types'" } },
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        ...sharedConfig,
        importSchemaTypesFrom: 'api/gql/types',
      },
    },
  },
}

export default config
