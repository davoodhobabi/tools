import { Router } from "express";
import multer from "multer";
import archiver = require("archiver");
import type { ConvertRequest, UploadedImage } from "./imageTypeConvert.type.js";
import { convertImages, normalizeFormat } from "./imageTypeConvert.logical.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.post("/api/convert", upload.any(), async (req, res) => {
  try {
    const request = req as ConvertRequest;
    const allFiles = request.files;
    const files: UploadedImage[] = Array.isArray(allFiles)
      ? allFiles.filter((file) => file.mimetype.startsWith("image/"))
      : [];

    if (files.length === 0) {
      res.status(400).json({ message: "No image files provided." });
      return;
    }

    const outputFormat = normalizeFormat(request.body?.outputFormat ?? "webp");
    if (!outputFormat) {
      res.status(400).json({ message: "Invalid output format." });
      return;
    }

    const converted = await convertImages(files, outputFormat);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="converted-${outputFormat}.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", () => {
      if (!res.headersSent) {
        res.status(500).json({ message: "Zip generation failed." });
      } else {
        res.end();
      }
    });

    archive.pipe(res);
    for (const item of converted) {
      archive.append(item.data, { name: item.name });
    }
    await archive.finalize();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image conversion failed.";
    res.status(500).json({ message });
  }
});

export { router as imageTypeConvertRouter };
