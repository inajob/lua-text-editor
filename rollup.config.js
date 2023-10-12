import ignore from "rollup-plugin-ignore"
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    inlineDynamicImports: true,
    name: "luaEditor"
  },
  watch: {
    include: 'src/**'
  },
  plugins: [commonjs(),resolve(),ignore(['path', 'fs', 'child_process', 'crypto', 'url', 'module'])],
}

