import type { ToolModule } from "./tool.type.js";
import { imageTypeConvertTool } from "./image-type-convert/index.js";

export const tools: ToolModule[] = [imageTypeConvertTool];
