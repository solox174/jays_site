import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Add the path to the directory containing amplify_outputs.json
			// (e.g., the project root '.', or a specific directory like 'src')
			allow: ['.'],
		}
	}
});
