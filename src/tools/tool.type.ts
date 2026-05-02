import type { Express } from "express";

export interface ToolModule {
  id: string;
  title: string;
  basePath: string;
  register: (app: Express) => void;
}
