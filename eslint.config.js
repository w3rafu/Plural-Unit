import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_|\\$\\$' }
			],
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		ignores: [
			'.svelte-kit/',
			'build/',
			'node_modules/',
			'dist/',
			'test-results/',
			'tmp/',
			'supabase/functions/'
		]
	}
);
