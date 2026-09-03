import fs from "fs";
import { pool } from "../db";
import { OverpassElement } from "../ingestion/osm/client";
import { OsmSyncService } from "../ingestion/osm/service";

async function readInput(): Promise<string> {
  const filePath = process.argv[2];
  if (filePath) {
    return fs.readFileSync(filePath, "utf8");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function run(): Promise<void> {
  try {
    const raw = await readInput();
    const payload = JSON.parse(raw) as OverpassElement[] | { elements?: OverpassElement[] };
    const elements = Array.isArray(payload) ? payload : payload.elements;

    if (!Array.isArray(elements)) {
      throw new Error("Expected an Overpass JSON object with an elements array.");
    }

    const result = await OsmSyncService.importOsmElements(elements);
    console.log(JSON.stringify({ ...result, source: "osm_bulk" }));
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
