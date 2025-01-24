#![allow(non_snake_case)]
#![allow(non_camel_case_types)]

use oxipng;
use napi::bindgen_prelude::{Uint8Array, Error, Status, AsyncTask, Env};
use napi_derive::napi;
use napi::Task;

 #[napi(string_enum)]
pub enum InterlaceMode {
  remove,
  apply,
  keep,
}

#[napi(object)]
pub struct OxipngOptions {
  pub force: Option<bool>,
  pub optimizationLevel: Option<u8>,
  // overrides optimizationLevel
  pub optimizationMax: Option<bool>,
//  pub stripSafe: Option<bool>,
//  pub stripAll: Option<bool>,
//  pub stripChunks: Option<Vec<String>>,
//  pub keepChunks: Option<Vec<String>>,
  pub optimizeAlpha: Option<bool>,
  pub interlace: Option<InterlaceMode>,
  pub scale16: Option<bool>,
//  pub filters: Option<String>,
//  pub fastEvaluation: Option<bool>,
//  pub compressionLevel: Option<u8>,
  pub bitDepthReduction: Option<bool>,
  pub colorTypeReduction: Option<bool>,
  pub paletteReduction: Option<bool>,
  pub grayscaleReduction: Option<bool>,
  pub idatRecoding: Option<bool>,
//  pub useZopfli: Option<bool>,
//  pub fixErrors: Option<bool>,
//  pub zopfliIterations: Option<u8>,
//  pub timeout: Option<u16>,
}

fn getBaseOptions (optimizationLevel: Option<u8>, optimizationMax: Option<bool>) -> oxipng::Options {
  if let Some(optMax) = optimizationMax {
    if optMax {
      return oxipng::Options::max_compression();
    }
  }

  if let Some(optLevel) = optimizationLevel {
    return oxipng::Options::from_preset(optLevel)
  }

  return oxipng::Options::default();
}

fn parseOptions(options: OxipngOptions) -> oxipng::Options {
  let mut oxi_opts = getBaseOptions(options.optimizationLevel, options.optimizationMax);

  if let Some(force) = options.force {
    oxi_opts.force = force;
  }

  if let Some(optimize_alpha) = options.optimizeAlpha {
    oxi_opts.optimize_alpha = optimize_alpha;
  }

  if let Some(bitDepthReduction) = options.bitDepthReduction {
    oxi_opts.bit_depth_reduction = bitDepthReduction;
  }

  if let Some(colorTypeReduction) = options.colorTypeReduction {
    oxi_opts.color_type_reduction = colorTypeReduction;
  }

  if let Some(paletteReduction) = options.paletteReduction {
    oxi_opts.palette_reduction = paletteReduction;
  }

  if let Some(grayscaleReduction) = options.grayscaleReduction {
    oxi_opts.grayscale_reduction = grayscaleReduction;
  }

  if let Some(scale16) = options.scale16 {
    oxi_opts.scale_16 = scale16;
  }

  if let Some(idat_recoding) = options.idatRecoding {
    oxi_opts.idat_recoding = idat_recoding;
  }

  if let Some(interlace) = options.interlace {
    match interlace {
      InterlaceMode::remove => {
        oxi_opts.interlace = Some(oxipng::Interlacing::None);
      },
      InterlaceMode::apply => {
        oxi_opts.interlace = Some(oxipng::Interlacing::Adam7);
      },
      InterlaceMode::keep => {
        oxi_opts.interlace = None;
      }
    }
  }

  return oxi_opts;
}

#[napi(
  js_name = "optimizeOxipngSync",
)]
pub fn optimize_oxipng_sync(input: Uint8Array, options: OxipngOptions) -> napi::Result<Uint8Array> {
  let data = input.to_vec();
  let oxi_opts = parseOptions(options);

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

#[napi(
  js_name = "optimizeOxipng",
)]
pub fn optimize_oxipng(input: Uint8Array, options: OxipngOptions) -> AsyncTask<AsyncOxipng> {
  let data = input.to_vec();
  let oxi_opts = parseOptions(options);

  AsyncTask::new(AsyncOxipng { data, oxi_opts })
}
