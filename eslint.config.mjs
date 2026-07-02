import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        files: ['**/*.{js,ts}'],
        extends: [
            tseslint.configs.strict,
            tseslint.configs.stylistic,
        ],
    },
    {
        ignores: ['dist/**', 'node_modules/**'],
    }
]);