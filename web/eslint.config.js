import config from '@helpwave/eslint-config'

export default [
  {
    ignores: [
      'api/gql/*',
    ],
  },

  ...config.nextExtension,
]
