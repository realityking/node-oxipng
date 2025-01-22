export type Options = {
  force?: boolean
  optimizationLevel?: number
  optimizationMax?: boolean
  optimizeAlpha?: boolean
  interlace?: InterlaceMode
}

export function optimizeOxipngSync(input: Uint8Array, options?: Options) : Uint8Array;

export function optimizeOxipng(input: Uint8Array, options?: Options) : Promise<Uint8Array>;

export const enum InterlaceMode {
  remove = 'remove',
  apply = 'apply',
  keep = 'keep'
}
export interface OxipngOptions {
  force?: boolean
  optimizationLevel?: number
  optimizationMax?: boolean
  optimizeAlpha?: boolean
  interlace?: InterlaceMode
}
export declare function optimizeOxipngSync(input: Uint8Array, options: OxipngOptions): Uint8Array
export declare function optimizeOxipng(input: Uint8Array, options: OxipngOptions): Promise<Uint8Array>
