import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

import path from 'path';
import postcss from 'rollup-plugin-postcss';
import less from 'less';

const production = !process.env.ROLLUP_WATCH;

const resolveFile = function (filePath) {
	return path.join(__dirname, './', filePath)
}
const processLess = function (context, payload) {
	return new Promise((resolve, reject) => {
		less.render({
			file: context
		}, function (err, result) {
			if (!err) {
				resolve(result);
			} else {
				reject(err);
			}
		});

		less.render(context, {})
			.then(function (output) {
				// output.css = string of css
				// output.map = string of sourcemap
				// output.imports = array of string filenames of the imports referenced
				if (output && output.css) {
					resolve(output.css);
				} else {
					reject({})
				}
			},
				function (err) {
					reject(err)
				});

	})
}

export default {
	input: resolveFile('src/main.js'),
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		postcss({
			extract: true,
			minimize: production,
			process: processLess,
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file — better for performance
			css: css => {
				css.write('public/build/bundle.css');
			}
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),

		nodeResolve({
			jsnext: true,
			main: true
		}),
		commonjs({
			include: /node_modules/
		}),
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
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

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
