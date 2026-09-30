import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
	},
	expect: {
		requireAssertions: true,
	},
})
