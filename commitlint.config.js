export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
        'build',
      ],
    ],
    'subject-max-length': [2, 'always', 100],
    'subject-empty': [2, 'never'],
    'subject-case': [0],  // allow uppercase in subjects (e.g. W3, Phase 2.1, acronyms)
    'type-empty': [2, 'never'],
  },
}
