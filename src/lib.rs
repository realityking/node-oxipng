#![allow(non_snake_case)]
#![allow(non_camel_case_types)]

use std::num::NonZeroU8;

use napi::bindgen_prelude::{AsyncTask, Env, Error, Status, Uint8Array};
use napi::Task;
use napi_derive::napi;
use oxipng;

#[napi(string_enum)]
pub enum InterlaceMode {
  remove,
  apply,
  keep,
}

#[napi(string_enum)]
pub enum Filter {
  // Standard filter types
  None,
  Sub,
  Up,
  Average,
  Paeth,
  // Heuristic strategies
  MinSum,
  Entropy,
  Bigrams,
  BigEnt,
  Brute,
}

impl TryFrom<Filter> for oxipng::RowFilter {
  type Error = ();

  fn try_from(value: Filter) -> Result<Self, Self::Error> {
    match value {
      Filter::None => Ok(oxipng::RowFilter::None),
      Filter::Sub => Ok(oxipng::RowFilter::Sub),
      Filter::Up => Ok(oxipng::RowFilter::Up),
      Filter::Average => Ok(oxipng::RowFilter::Average),
      Filter::Paeth => Ok(oxipng::RowFilter::Paeth),
      Filter::MinSum => Ok(oxipng::RowFilter::MinSum),
      Filter::Entropy => Ok(oxipng::RowFilter::Entropy),
      Filter::Bigrams => Ok(oxipng::RowFilter::Bigrams),
      Filter::BigEnt => Ok(oxipng::RowFilter::BigEnt),
      Filter::Brute => Ok(oxipng::RowFilter::Brute),
    }
  }
}

#[napi(object)]
pub struct OxipngOptions {
  pub force: Option<bool>,
  pub optimizationLevel: Option<u8>,
  // overrides optimizationLevel
  pub optimizationMax: Option<bool>,
  pub stripSafe: Option<bool>,
  pub stripAll: Option<bool>,
  pub stripChunks: Option<Vec<String>>,
  pub keepChunks: Option<Vec<String>>,
  pub optimizeAlpha: Option<bool>,
  pub interlace: Option<InterlaceMode>,
  pub scale16: Option<bool>,
  pub filter: Option<Vec<Filter>>,
  pub fastEvaluation: Option<bool>,
  pub bitDepthReduction: Option<bool>,
  pub colorTypeReduction: Option<bool>,
  pub paletteReduction: Option<bool>,
  pub grayscaleReduction: Option<bool>,
  pub idatRecoding: Option<bool>,
  pub compressionLevel: Option<u8>,
  pub useZopfli: Option<bool>,
  pub zopfliIterations: Option<u8>,
  //  pub fixErrors: Option<bool>,
  //  pub timeout: Option<u16>,
}

const DISPLAY_CHUNKS: [[u8; 4]; 7] = [
  *b"cICP", *b"iCCP", *b"sRGB", *b"pHYs", *b"acTL", *b"fcTL", *b"fdAT",
];

const FORBIDDEN_CHUNKS: [[u8; 4]; 5] = [*b"IHDR", *b"IDAT", *b"tRNS", *b"PLTE", *b"IEND"];

fn parse_chunk_name(name: &str) -> Result<[u8; 4], String> {
  name
    .trim()
    .as_bytes()
    .try_into()
    .map_err(|_| format!("Invalid chunk name {name}"))
}

fn getBaseOptions(optimizationLevel: Option<u8>, optimizationMax: Option<bool>) -> oxipng::Options {
  if let Some(optMax) = optimizationMax {
    if optMax {
      return oxipng::Options::max_compression();
    }
  }

  if let Some(optLevel) = optimizationLevel {
    return oxipng::Options::from_preset(optLevel);
  }

  oxipng::Options::default()
}

fn parseOptions(options: OxipngOptions) -> napi::Result<oxipng::Options> {
  let mut oxi_opts = getBaseOptions(options.optimizationLevel, options.optimizationMax);

  if let Some(force) = options.force {
    oxi_opts.force = force;
  }

  if let Some(optimize_alpha) = options.optimizeAlpha {
    oxi_opts.optimize_alpha = optimize_alpha;
  }

  if let Some(bit_depth_reduction) = options.bitDepthReduction {
    oxi_opts.bit_depth_reduction = bit_depth_reduction;
  }

  if let Some(color_type_reduction) = options.colorTypeReduction {
    oxi_opts.color_type_reduction = color_type_reduction;
  }

  if let Some(palette_reduction) = options.paletteReduction {
    oxi_opts.palette_reduction = palette_reduction;
  }

  if let Some(grayscale_reduction) = options.grayscaleReduction {
    oxi_opts.grayscale_reduction = grayscale_reduction;
  }

  if let Some(scale16) = options.scale16 {
    oxi_opts.scale_16 = scale16;
  }

  if let Some(idat_recoding) = options.idatRecoding {
    oxi_opts.idat_recoding = idat_recoding;
  }

  if let Some(filter) = options.filter {
    oxi_opts.filter.clear();
    for f in filter {
      oxi_opts.filter.insert(f.try_into().unwrap());
    }
  }

  if let Some(fast_evaluation) = options.fastEvaluation {
    oxi_opts.fast_evaluation = fast_evaluation;
  }

  if let Some(interlace) = options.interlace {
    match interlace {
      InterlaceMode::remove => {
        oxi_opts.interlace = Some(oxipng::Interlacing::None);
      }
      InterlaceMode::apply => {
        oxi_opts.interlace = Some(oxipng::Interlacing::Adam7);
      }
      InterlaceMode::keep => {
        oxi_opts.interlace = None;
      }
    }
  }

  if let Some(keep_chunks) = options.keepChunks {
    let mut keep_display = false;
    let mut names = keep_chunks
      .iter()
      .filter_map(|name| {
        if name == "display" {
          keep_display = true;
          return None;
        }
        Some(parse_chunk_name(name))
      })
      .collect::<Result<oxipng::IndexSet<_>, _>>()
      .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;

    if keep_display {
      names.extend(DISPLAY_CHUNKS.iter().copied());
    }

    oxi_opts.strip = oxipng::StripChunks::Keep(names);
  }

  if let Some(strip_chunks) = options.stripChunks {
    let names = strip_chunks
      .iter()
      .map(|x| {
        let name: [u8; 4] = parse_chunk_name(x)?;
        if FORBIDDEN_CHUNKS.contains(&name) {
          return Err(format!("{x} chunk is not allowed to be stripped"));
        }
        Ok(name)
      })
      .collect::<Result<_, _>>()
      .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;

    oxi_opts.strip = oxipng::StripChunks::Strip(names)
  }

  if let Some(strip_all) = options.stripAll {
    if strip_all {
      oxi_opts.strip = oxipng::StripChunks::All;
    }
  }

  if let Some(strip_safe) = options.stripSafe {
    if strip_safe {
      oxi_opts.strip = oxipng::StripChunks::Safe;
    }
  }

  if let Some(use_zopfli) = options.useZopfli {
    if use_zopfli {
      let mut iterations = NonZeroU8::new(15).unwrap();
      if let Some(zopfli_iterations) = options.zopfliIterations {
        // No need to check for > 255 as that value doesn't fit into a u8
        if zopfli_iterations < 1 {
          return Err(Error::new(
            Status::InvalidArg,
            "value `\"zopfliIterations\"` must be between 1 and 255",
          ));
        }
        iterations = NonZeroU8::new(zopfli_iterations).unwrap();
      }
      oxi_opts.deflate = oxipng::Deflaters::Zopfli { iterations };
    }
  }

  if let Some(compression) = options.compressionLevel {
    // No need to check for < 0> as that value doesn't fit into a u8
    if compression > 12 {
      return Err(Error::new(
        Status::InvalidArg,
        "value `\"compressionLevel\"` must be between 0 and 12",
      ));
    }
    oxi_opts.deflate = oxipng::Deflaters::Libdeflater { compression };
  }

  Ok(oxi_opts)
}

#[napi(js_name = "optimizeOxipngSync")]
pub fn optimize_oxipng_sync(input: Uint8Array, options: OxipngOptions) -> napi::Result<Uint8Array> {
  let data = input.to_vec();
  let oxi_opts = parseOptions(options)?;

  let result: Vec<u8> = oxipng::optimize_from_memory(&data, &oxi_opts)
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;

  Ok(Uint8Array::new(result))
}

pub struct AsyncOxipng {
  data: Vec<u8>,
  oxi_opts: oxipng::Options,
}

#[napi]
impl Task for AsyncOxipng {
  type Output = Vec<u8>;
  type JsValue = Uint8Array;

  fn compute(&mut self) -> napi::Result<Self::Output> {
    oxipng::optimize_from_memory(&self.data, &self.oxi_opts)
      .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))
  }

  fn resolve(&mut self, _env: Env, output: Self::Output) -> napi::Result<Self::JsValue> {
    Ok(Uint8Array::new(output))
  }
}

#[napi(js_name = "optimizeOxipng")]
pub fn optimize_oxipng(
  input: Uint8Array,
  options: OxipngOptions,
) -> napi::Result<AsyncTask<AsyncOxipng>> {
  let data = input.to_vec();
  let oxi_opts = parseOptions(options)?;

  Ok(AsyncTask::new(AsyncOxipng { data, oxi_opts }))
}
