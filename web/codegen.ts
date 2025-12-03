import type { CodegenConfig } from '@graphql-codegen/cli'
import 'dotenv/config'
import { getConfig } from './utils/config'

const config: CodegenConfig = {
    schema: [
        {
            [getConfig().graphqlEndpoint]: {
                headers: {
                    cookie: `access_token=${process.env.GRAPHQL_TOKEN}`,
                },
            },
        },
    ],
    documents: 'api/graphql/**/*.graphql',
    generates: {
        'api/gql/generated.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-react-query',
            ],
            config: {
                fetcher: {
                    func: './fetcher#fetcher',
                    isReactHook: false,
                },
                reactQueryVersion: 5,
            },
        },
    },
}

export default config