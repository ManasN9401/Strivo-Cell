import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!supabaseKey) {
  throw new Error("Missing NEXT_SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const bucket = "videos";

async function listAll(prefix) {
  const out = [];

  async function walk(path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit: 1000 });

    if (error) throw error;

    for (const item of data) {
      const fullPath = `${path}/${item.name}`;

      // Folders have null metadata; files have metadata.
      if (item.metadata === null) {
        await walk(fullPath);
      } else {
        out.push(fullPath);
      }
    }
  }

  await walk(prefix);
  return out;
}

async function movePrefix(fromPrefix, toPrefix) {
  const files = await listAll(fromPrefix);

  for (const fromPath of files) {
    const toPath = fromPath.replace(fromPrefix, toPrefix);

    console.log(`Moving: ${fromPath} -> ${toPath}`);

    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) throw error;
  }
}

await movePrefix("Untitled folder/movies", "movies");
await movePrefix("Untitled folder/shows", "shows");

console.log("Done.");