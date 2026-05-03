import type { Request } from "express";
import type { OutputFormat } from "./imageSmartCompress.logical.js";

export type CompressBody = {
  scalePercent?: string;
  quality?: string;
};

export type CompressRequest = Request & {
  file?: Express.Multer.File;
  body?: CompressBody;
};

export type PreviewResponseJson = {
  originalBytes: number;
  originalWidth: number;
  originalHeight: number;
  estimatedBytes: number;
  outputWidth: number;
  outputHeight: number;
  format: OutputFormat;
  previewDataUrl: string | null;
};
