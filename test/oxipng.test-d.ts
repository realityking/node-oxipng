import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import {expectType, expectError} from 'tsd';

import {optimizeOxipng, optimizeOxipngSync, InterlaceMode} from '..';

// sync
const image = readFileSync(join(__dirname, 'test/fixtures/test.png'));
const result = optimizeOxipngSync(image);
writeFileSync(join(__dirname, '/test-out.png'), result);

// Supported options
optimizeOxipngSync(image, {
  optimizationLevel: 3,
  scale16: true,
  fastEvaluation: true,
  interlace: InterlaceMode.remove,
  keepChunks: ['eXif', 'display']
});

// Arrays are not values
expectError(optimizeOxipngSync(image, {
  scale16: []
}));

// Unknown option
expectError(optimizeOxipngSync(image, {unknown: true}));

// Not an object as options
expectError(optimizeOxipngSync(image, ''));

// Incorect options
expectError(optimizeOxipngSync(image, {
  scale16: 1
}));
expectError(optimizeOxipngSync(image, {
  interlace: '12'
}));
expectError(optimizeOxipngSync(image, {
  keepChunks: ['12', 12]
}));

// Not an object as input
expectError(optimizeOxipngSync(''));

// No arguments
expectError(optimizeOxipngSync());

// async
readFile(join(__dirname, 'test/fixtures/test.png'))
.then(image => optimizeOxipng(image))
.then(image => {
  expectType<Uint8Array>(image);
  return writeFile(join(__dirname, '/test-out.png'), result);
});

// Unknown option
expectError(optimizeOxipng(image, {unknown: true}));

// Not an object as options
expectError(optimizeOxipng(image, ''));

// Not an object as input
expectError(optimizeOxipng(''));

// No arguments
expectError(optimizeOxipng());
