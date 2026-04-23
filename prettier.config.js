/** @type {import('prettier').Config} */
export default {
	trailingComma: 'es5',
	useTabs: true,
	arrowParens: 'always',
	semi: false,
	singleQuote: false,
	overrides: [
		{
			files: '**/*.css',
			options: {
				printWidth: 1500,
			},
		},
	],
};
