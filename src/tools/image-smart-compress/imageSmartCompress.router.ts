import { Router } from "express";
import multer from "multer";
import type { CompressRequest } from "./imageSmartCompress.type.js";
import {
  contentTypeForFormat,
  fileExtensionForFormat,
  optimizeImage,
  parseQuality,
  parseScalePercent,
  previewCompressed,
} from "./imageSmartCompress.logical.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.post("/api/preview", upload.single("image"), async (req, res) => {
  try {
    const request = req as CompressRequest;
    const file = request.file;
    if (!file || !file.mimetype.startsWith("image/")) {
      res.status(400).json({ message: "No image file provided." });
      return;
    }

    const scalePercent = parseScalePercent(request.body?.scalePercent);
    const quality = parseQuality(request.body?.quality);

    const summary = await previewCompressed(file.buffer, { scalePercent, quality }, file.mimetype);

    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed.";
    res.status(500).json({ message });
  }
});

router.post("/api/export", upload.single("image"), async (req, res) => {
  try {
    const request = req as CompressRequest;
    const file = request.file;
    if (!file || !file.mimetype.startsWith("image/")) {
      res.status(400).json({ message: "No image file provided." });
      return;
    }

    const scalePercent = parseScalePercent(request.body?.scalePercent);
    const quality = parseQuality(request.body?.quality);

    const result = await optimizeImage(file.buffer, { scalePercent, quality }, file.mimetype);

    const ext = fileExtensionForFormat(result.format);
    const base = file.originalname.replace(/\.[^/.]+$/, "").trim() || "optimized";
    const safeBase = base.replace(/[^\w.-]+/g, "_").slice(0, 120);

    res.setHeader("Content-Type", contentTypeForFormat(result.format));
    res.setHeader("Content-Disposition", `attachment; filename="${safeBase}.${ext}"`);
    res.send(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    res.status(500).json({ message });
  }
});

export { router as imageSmartCompressRouter };
