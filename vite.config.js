import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
	plugins: [sveltekit(), enhancedImages()],
	optimizeDeps: {
		include: ['air-datepicker/locale/en']
	},
	server: {
		fs: {
			// Add the path to the directory containing amplify_outputs.json
			// (e.g., the project root '.', or a specific directory like 'src')
			allow: ['.'],
		}
	}
});
