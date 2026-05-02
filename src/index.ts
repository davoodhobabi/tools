import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

type ConversionResult = {
  inputPath: string;
  outputPath: string;
  success: boolean;
  reason?: string;
};

const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".webp",
  ".avif",
  ".heif",
  ".heic",
  ".svg",
]);

const inputArg = process.argv[2] ?? "./input";
const outputArg = process.argv[3] ?? "./output";

const inputDir = resolve(inputArg);
const outputDir = resolve(outputArg);

async function isDirectory(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isDirectory();
  } catch {
    return false;
  }
}

function isSupportedFile(fileName: string): boolean {
  const extension = extname(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(extension);
}

async function convertOneImage(inputPath: string, outputPath: string): Promise<ConversionResult> {
  try {
    await sharp(inputPath, { failOn: "none" }).rotate().webp({ quality: 90 }).toFile(outputPath);

    const outputMeta = await sharp(outputPath).metadata();
    if (outputMeta.format !== "webp") {
      return {
        inputPath,
        outputPath,
        success: false,
        reason: "output format validation failed",
      };
    }

    return { inputPath, outputPath, success: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return { inputPath, outputPath, success: false, reason };
  }
}

async function run(): Promise<void> {
  const inputExists = await isDirectory(inputDir);
  if (!inputExists) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  await mkdir(outputDir, { recursive: true });

  const entries = await readdir(inputDir, { withFileTypes: true });
  const imageFiles = entries.filter((entry) => entry.isFile() && isSupportedFile(entry.name));

  if (imageFiles.length === 0) {
    console.log(`No supported image files found in: ${inputDir}`);
    return;
  }

  const results: ConversionResult[] = [];

  for (const file of imageFiles) {
    const source = join(inputDir, file.name);
    const target = join(outputDir, `${basename(file.name, extname(file.name))}.webp`);
    const result = await convertOneImage(source, target);
    results.push(result);
  }

  const successCount = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success);

  console.log(`Converted ${successCount}/${results.length} images to webp.`);
  if (failed.length > 0) {
    console.log("Failed files:");
    for (const item of failed) {
      console.log(`- ${item.inputPath} -> ${item.reason}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown fatal error";
  console.error(`Conversion failed: ${message}`);
  process.exit(1);
});
