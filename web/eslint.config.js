import config from '@helpwave/eslint-config'

export default [
  {
    ignores: [
      'api/gql/*',
      'i18n/*',
      'next-env.d.ts',
    ],
  },

  ...config.nextExtension,
]
