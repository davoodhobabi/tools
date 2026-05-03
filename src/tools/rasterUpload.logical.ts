export type RasterLikeFile = {
  mimetype?: string;
  originalname: string;
};

export function isAcceptedRasterImage(file: RasterLikeFile): boolean {
  const mime = (file.mimetype || "").toLowerCase();
  if (mime.startsWith("image/")) {
    return true;
  }
  const name = file.originalname.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

export function resolveImageMimeForSharp(file: RasterLikeFile): string {
  const mime = (file.mimetype || "").toLowerCase();
  if (mime.startsWith("image/")) {
    return file.mimetype || "application/octet-stream";
  }
  const name = file.originalname.toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    return "image/heic";
  }
  return file.mimetype || "application/octet-stream";
}
