import config from '@helpwave/eslint-config'

export default [
  {
    ignores: [
      'api/gql/*',
      'i18n/*',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      indent: ['warn', 2],
    },
  },
  ...config.nextExtension,
]
