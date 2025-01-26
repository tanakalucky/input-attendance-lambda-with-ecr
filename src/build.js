const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    outfile: 'index.js',
    minify: true,
    external: [
      'playwright-core/*',
      'chromium-bidi/*',
      'playwright/*',
      '../package.json',
      '../../cli',
    ],
    loader: {
      '.node': 'file',
    },
  })
  .catch(() => process.exit(1));
