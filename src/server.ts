import { resolve } from "node:path";
import express from "express";
import { tools } from "./tools/registry.js";

const app = express();
const rootPublicDir = resolve("public");

app.use(express.static(rootPublicDir));

for (const tool of tools) {
  tool.register(app);
}

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Web app is running on http://localhost:${port}`);
});
