import terser from '@rollup/plugin-terser';
import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import pkg from './package.json' with { type: 'json' };

export default [
  {
    input: 'src/index.ts',
    output: { file: `${pkg.types}`, format: 'es' },
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: {
      name: 'spred',
      file: `dist/spred.min.js`,
      format: 'umd',
    },
    plugins: [
      ts(),
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
    plugins: [ts()],
    output: { file: pkg.main, format: 'cjs' },
  },

  {
    input: 'src/index.ts',
    plugins: [ts()],
    output: { file: pkg.module, format: 'es' },
  },
];
