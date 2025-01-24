export const enum InterlaceMode {
  remove = 'remove',
  apply = 'apply',
  keep = 'keep'
}

export const enum Filter {
  None = 'None',
  Sub = 'Sub',
  Up = 'Up',
  Average = 'Average',
  Paeth = 'Paeth',
  MinSum = 'MinSum',
  Entropy = 'Entropy',
  Bigrams = 'Bigrams',
  BigEnt = 'BigEnt',
  Brute = 'Brute'
}

export type Options = {
  force?: boolean
  optimizationLevel?: number
  optimizationMax?: boolean
  stripSafe?: boolean
  stripAll?: boolean
  stripChunks?: Array<string>
  keepChunks?: Array<string>
  optimizeAlpha?: boolean
  interlace?: InterlaceMode
  scale16?: boolean
  filter?: Array<Filter>
  fastEvaluation?: boolean
  bitDepthReduction?: boolean
  colorTypeReduction?: boolean
  paletteReduction?: boolean
  grayscaleReduction?: boolean
  idatRecoding?: boolean
  compressionLevel?: number,
  useZopfli?: boolean,
  zopfliIterations?: number,
}

export function optimizeOxipngSync(input: Uint8Array, options?: Options) : Uint8Array;

export function optimizeOxipng(input: Uint8Array, options?: Options) : Promise<Uint8Array>;
