import path from "node:path"
import { fileURLToPath } from "node:url"
import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
	{
		ignores: ["dist"],
	},
	{
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.strict,
			...tseslint.configs.stylistic,
		],
		files: ["**/*.ts"],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir,
			},
		},
		rules: {
			"@typescript-eslint/await-thenable": "warn",
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/array-type": "off",
			"@typescript-eslint/class-literal-property-style": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-dynamic-delete": "off",
			"require-await": ["error"],
			"no-duplicate-imports": ["warn"],
			curly: ["warn", "all"],
		},
	},
)
