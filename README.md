# node-oxipng

[![Built on N-API v3](https://img.shields.io/badge/N--API-v3-green.svg)](https://nodejs.org/api/n-api.html#n_api_n_api_version_matrix)

Node.js bindings for [oxipng](https://github.com/shssoichiro/oxipng).

Optimizes PNG images for size. This is very slow and should only be done for static resources.

## Usage

```js
const { optimizeOxipng } = require('node-oxipng')
const { readFile, writeFile } = require('fs/promises')

readFile('./raw.png')
.then(buffer => optimizeOxipng(buffer))
.then(buffer => writeFile('./optimized.png', buffer))
```

### API

#### optimizeOxipng(input, [options]): Promise<Uint8Array>

#### input

Type: `Uint8Array`

#### options

Type: `Object`

See [Options](#options) for possible values.

#### optimizeOxipngSync(input, [options]): Uint8Array

*Using this function is strongly discouraged.* Running oxipng can easily take
more than 30s even on relatively small images (< 1 MB). `optimizeOxipngSync`
will block the entire process during this time.

#### input

Type: `Uint8Array`

#### options

Type: `Object`

See [Options](#options) for possible values.

### Options

| Name                 | Type       | Default  | Description |
|----------------------|------------|----------|---------------------- |
| `force`              | `boolean`  | `false`  | Write to output even if there was no improvement in compression. |
| `optimizationLevel`  | `integer`  | `2`      | Set the optimization level preset. Valid values are `0` to `6`. The default level 2 is quite fast and provides good compression. Lower levels are faster, higher levels provide better compression, though with increasingly diminishing returns. |
| `optimizationMax`    | `boolean`  | `false`  | Force the highest optimization level. Overrides `optimizationLevel` |
| `optimizeAlpha`      | `boolean`  | `false`  | Whether to allow transparent pixels to be altered to improve compression. |
| `interlace`          | `string`   | `remove` | Whether to change the interlacing type of the file. Valid values are `remove`, `apply`, and `keep` |
| `bitDepthReduction`  | `boolean`  | `true`   | Whether to attempt bit depth reduction. |
| `colorTypeReduction` | `boolean`  | `true`   | Whether to attempt color type reduction. |
| `paletteReduction`   | `boolean`  | `true`   | Whether to attempt palette reduction. |
| `grayscaleReduction` | `boolean`  | `true`   | grayscale_reduction. |
