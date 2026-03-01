export default {
  // Sync README → docs/index.md on commit.
  // Function syntax prevents lint-staged appending filenames to these commands.
  // CONTRIBUTING.md, CHANGELOG.md, THIRD-PARTY-NOTICES.md are gitignored in docs/
  // and copied automatically by the MkDocs hook (scripts/mkdocs_hooks.py).
  'README.md': () => [
    'node scripts/sync-readme.mjs',
    'prettier --write docs/index.md',
    'git add docs/index.md',
  ],

  // Format and lint staged source files — string syntax passes filenames automatically
  '*.{js,ts,json,md,yml,yaml}': ['prettier --write', 'eslint --fix'],
};
