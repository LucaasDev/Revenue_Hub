import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Proibir console.log em produção (warn para não quebrar build)
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      // Forçar uso de tipos explícitos em funções exportadas
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Desabilitar regra de any para código de migração
      '@typescript-eslint/no-explicit-any': 'warn',
      // Preferir const
      'prefer-const': 'error',
      // Sem variáveis não usadas (exceto prefixadas com _)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default eslintConfig
