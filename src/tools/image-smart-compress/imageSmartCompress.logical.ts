import sharp from "sharp";

const outputFormats = ["jpeg", "png", "webp", "avif", "gif", "tiff", "heif"] as const;

export type OutputFormat = (typeof outputFormats)[number];

export type CompressOptions = {
  scalePercent: number;
  quality: number;
};

export function parseScalePercent(value: unknown): number {
  const raw = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(raw)) {
    return 100;
  }
  return Math.min(200, Math.max(10, Math.round(raw)));
}

export function parseQuality(value: unknown): number {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? Math.round(value) : NaN;
  if (!Number.isFinite(raw)) {
    return 82;
  }
  return Math.min(100, Math.max(1, raw));
}

export function deriveOutputFormat(meta: sharp.Metadata, mimetype: string): OutputFormat {
  const f = (meta.format || "").toLowerCase();
  if (f === "jpeg" || f === "jpg") {
    return "jpeg";
  }
  if (f === "png") {
    return "png";
  }
  if (f === "webp") {
    return "webp";
  }
  if (f === "avif") {
    return "avif";
  }
  if (f === "gif") {
    return "gif";
  }
  if (f === "tiff" || f === "tif") {
    return "tiff";
  }
  if (f === "heif" || f === "heic") {
    return "heif";
  }
  const m = mimetype.toLowerCase();
  if (m.includes("jpeg") || m.endsWith("/jpg")) {
    return "jpeg";
  }
  if (m.includes("png")) {
    return "png";
  }
  if (m.includes("webp")) {
    return "webp";
  }
  if (m.includes("gif")) {
    return "gif";
  }
  if (m.includes("tiff")) {
    return "tiff";
  }
  if (m.includes("heif") || m.includes("heic")) {
    return "heif";
  }
  if (m.includes("avif")) {
    return "avif";
  }
  return "png";
}

function applyFormat(pipeline: sharp.Sharp, outputFormat: OutputFormat, quality: number): sharp.Sharp {
  const q = quality;
  if (outputFormat === "jpeg") {
    return pipeline.jpeg({ quality: q, mozjpeg: true });
  }
  if (outputFormat === "webp") {
    return pipeline.webp({ quality: q, effort: 6 });
  }
  if (outputFormat === "avif") {
    return pipeline.avif({ quality: q, effort: 4 });
  }
  if (outputFormat === "png") {
    const level = Math.max(0, Math.min(9, Math.round(9 - ((q - 1) / 99) * 9)));
    return pipeline.png({ compressionLevel: level, adaptiveFiltering: true });
  }
  if (outputFormat === "gif") {
    return pipeline.gif({ effort: Math.max(1, Math.min(10, Math.round(11 - q / 10))) });
  }
  if (outputFormat === "tiff") {
    return pipeline.tiff({ compression: "lzw", quality: q });
  }
  return pipeline.heif({ quality: q });
}

export async function optimizeImage(
  buffer: Buffer,
  options: CompressOptions,
  mimetype: string,
): Promise<{ data: Buffer; outputWidth: number; outputHeight: number; format: OutputFormat }> {
  let pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const outputFormat = deriveOutputFormat(meta, mimetype);

  const ow = meta.width ?? 0;
  const oh = meta.height ?? 0;
  if (ow < 1 || oh < 1) {
    throw new Error("Could not read image dimensions.");
  }

  const factor = options.scalePercent / 100;
  const newW = Math.max(1, Math.round(ow * factor));
  const newH = Math.max(1, Math.round(oh * factor));
  if (newW !== ow || newH !== oh) {
    pipeline = pipeline.resize({
      width: newW,
      height: newH,
      fit: "inside",
      withoutEnlargement: factor <= 1,
      kernel: sharp.kernel.lanczos3,
    });
  }

  pipeline = applyFormat(pipeline, outputFormat, options.quality);
  const data = await pipeline.toBuffer();
  const outMeta = await sharp(data).metadata();
  return {
    data,
    outputWidth: outMeta.width ?? newW,
    outputHeight: outMeta.height ?? newH,
    format: outputFormat,
  };
}

export async function previewCompressed(buffer: Buffer, options: CompressOptions, mimetype: string) {
  const rotated = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await rotated.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;
  const result = await optimizeImage(buffer, options, mimetype);
  const previewDataUrl = buildPreviewDataUrl(result.data, result.format);
  return {
    originalBytes: buffer.byteLength,
    originalWidth,
    originalHeight,
    estimatedBytes: result.data.byteLength,
    outputWidth: result.outputWidth,
    outputHeight: result.outputHeight,
    format: result.format,
    previewDataUrl,
  };
}

export function fileExtensionForFormat(format: OutputFormat): string {
  if (format === "jpeg") {
    return "jpg";
  }
  if (format === "tiff") {
    return "tif";
  }
  if (format === "heif") {
    return "heic";
  }
  return format;
}

export function contentTypeForFormat(format: OutputFormat): string {
  if (format === "jpeg") {
    return "image/jpeg";
  }
  if (format === "png") {
    return "image/png";
  }
  if (format === "webp") {
    return "image/webp";
  }
  if (format === "avif") {
    return "image/avif";
  }
  if (format === "gif") {
    return "image/gif";
  }
  if (format === "tiff") {
    return "image/tiff";
  }
  return "image/heif";
}

const maxInlinePreviewBytes = 3 * 1024 * 1024;

export function buildPreviewDataUrl(imageBuffer: Buffer, format: OutputFormat): string | null {
  if (imageBuffer.byteLength > maxInlinePreviewBytes) {
    return null;
  }
  const mime = contentTypeForFormat(format);
  return `data:${mime};base64,${imageBuffer.toString("base64")}`;
}
