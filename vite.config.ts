import { defineConfig } from "vite"
import autoprefixer from "autoprefixer"

export default defineConfig({
	base: "/blast-game/",
	server: {
		port: 5173,
	},
	css: {
		postcss: {
			plugins: [autoprefixer()],
		},
	},
})
