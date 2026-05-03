import type { Express } from "express";
import express from "express";
import { resolve } from "node:path";
import type { ToolModule } from "../tool.type.js";
import { imageSmartCompressRouter } from "./imageSmartCompress.router.js";

const basePath = "/image-smart-compress";
const staticDir = resolve("public/tools/image-smart-compress");

function register(app: Express): void {
  app.use(basePath, express.static(staticDir));
  app.get(`${basePath}/health`, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(basePath, imageSmartCompressRouter);
}

export const imageSmartCompressTool: ToolModule = {
  id: "image-smart-compress",
  title: "Image Smart Compress",
  basePath,
  register,
};
