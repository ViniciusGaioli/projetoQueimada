import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    prettier,
    {
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'typeLike', format: ['PascalCase'] },
                { selector: 'interface', format: ['PascalCase'] },
                { selector: 'typeParameter', format: ['PascalCase'], prefix: ['T'] },
            ],
        },
    },
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
