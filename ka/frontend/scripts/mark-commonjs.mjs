// The app is an ES-module package; the test build is CommonJS. This marks the build folder so Node loads it correctly.
import fs from 'node:fs';
fs.writeFileSync(new URL('../.test-build/package.json', import.meta.url), '{"type":"commonjs"}\n');
