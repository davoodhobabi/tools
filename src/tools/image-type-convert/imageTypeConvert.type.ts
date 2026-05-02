import type { Request } from "express";

export const supportedFormats = ["jpeg", "jpg", "png", "webp", "avif", "tiff"] as const;

export type SupportedFormat = (typeof supportedFormats)[number];

export type ConvertedFile = {
  name: string;
  data: Buffer;
};

export type UploadedImage = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

export type ConvertRequest = Request & {
  files?: UploadedImage[];
  body?: {
    outputFormat?: string;
  };
};
