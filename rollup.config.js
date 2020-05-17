import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';

const preprocess = sveltePreprocess({
  scss: {
    includePaths: ['src', 'node_modules'],
  },
  postcss: {
    plugins: [require('autoprefixer')],
  },
});

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/index.svelte.js',
	output: {
		sourcemap: true,
    format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
    svelte({
			dev: !production,
      preprocess,
			css: css => {
				css.write('public/build/bundle.css');
			}
		}),

    postcss(),

		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		!production && serve(),

		!production && livereload('public'),

		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'svelte-start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
