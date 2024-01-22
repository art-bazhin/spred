import terser from '@rollup/plugin-terser';
import ts from 'rollup-plugin-ts';
import pkg from './package.json' with { type: 'json' };

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'spred',
      file: `dist/spred.min.js`,
      format: 'umd',
    },
    plugins: [
      ts({
        tsconfig: {
          target: 'ES2015',
          module: 'es2015',
          strict: true,
        },
      }),
      terser({
        compress: {
          reduce_vars: false,
          reduce_funcs: false,
        },
      }),
    ],
  },

  {
    input: 'src/index.ts',
    plugins: [
      ts({
        tsconfig: {
          target: 'ES2015',
          module: 'es2015',
          declaration: true,
          strict: true,
        },
      }),
    ],
    output: { file: pkg.main, format: 'cjs' },
  },

  {
    input: 'src/index.ts',
    plugins: [
      ts({
        tsconfig: {
          target: 'ES2015',
          module: 'es2015',
          declaration: true,
          strict: true,
        },
      }),
    ],
    output: { file: pkg.module, format: 'es' },
  },
];
