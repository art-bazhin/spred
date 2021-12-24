import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'spred',
      file: `dist/${pkg.name}.min.js`,
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
      terser(),
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
    output: { file: pkg.esm, format: 'es' },
  },
];
