export type Options = {
  force?: boolean
  optimizationLevel?: number
  optimizationMax?: boolean
  optimizeAlpha?: boolean
  interlace?: InterlaceMode
}

export function optimizeOxipngSync(input: Uint8Array, options?: Options) : Uint8Array;

export function optimizeOxipng(input: Uint8Array, options?: Options) : Promise<Uint8Array>;
