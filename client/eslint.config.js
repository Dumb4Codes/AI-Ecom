import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives and the theme provider intentionally co-export
    // variants/hooks with components; fast-refresh granularity is not needed.
    files: ['src/components/ui/**', 'src/components/theme-provider.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      // vendored shadcn carousel syncs embla state in an effect by design
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
