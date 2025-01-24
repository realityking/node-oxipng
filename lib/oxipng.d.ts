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
  optimizeAlpha?: boolean
  interlace?: InterlaceMode
  bitDepthReduction?: boolean
  colorTypeReduction?: boolean
  paletteReduction?: boolean
  grayscaleReduction?: boolean
  scale16?: boolean
  idatRecording?: boolean
  stripSafe: boolean,
  stripAll: boolean,
  stripChunks: boolean,
  keepChunks: boolean,
  filter?: Array<Filter>,
  fastEvaluation?: boolean,
}

export function optimizeOxipngSync(input: Uint8Array, options?: Options) : Uint8Array;

export function optimizeOxipng(input: Uint8Array, options?: Options) : Promise<Uint8Array>;
