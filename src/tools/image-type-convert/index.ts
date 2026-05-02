import type { Express } from "express";
import express from "express";
import { resolve } from "node:path";
import type { ToolModule } from "../tool.type.js";
import { imageTypeConvertRouter } from "./imageTypeConvert.router.js";

const basePath = "/image-type-convert";
const staticDir = resolve("public/tools/image-type-convert");

function register(app: Express): void {
  app.use(basePath, express.static(staticDir));
  app.get(`${basePath}/health`, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(basePath, imageTypeConvertRouter);
}

export const imageTypeConvertTool: ToolModule = {
  id: "image-type-convert",
  title: "Image Type Convert",
  basePath,
  register,
};
