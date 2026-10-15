import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import express, { type Express } from "express";

export const registerProductionWeb = (app: Express) => {
  const webDistPath = fileURLToPath(new URL("../../../web/dist/", import.meta.url));
  const indexPath = join(webDistPath, "index.html");

  if (!existsSync(indexPath)) {
    throw new Error("Web build is missing.");
  }

  app.use(express.static(webDistPath));
  app.get("/{*splat}", (_request, response) => {
    response.sendFile(indexPath);
  });
};
