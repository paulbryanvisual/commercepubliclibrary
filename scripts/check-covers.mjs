/**
 * Batch-check Open Library covers and null out blank ones in the DB.
 * Run with: node scripts/check-covers.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 10; // concurrent requests
const MIN_IMAGE_SIZE = 1000; // bytes — anything smaller is a blank placeholder

async function checkCover(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    return buf.byteLength >= MIN_IMAGE_SIZE;
  } catch {
    return false;
  }
}

async function main() {
  // Get all books with cover URLs
  let offset = 0;
  let totalChecked = 0;
  let totalBlanked = 0;

  while (true) {
    const { data: books, error } = await supabase
      .from("catalog_books")
      .select("id, title, cover_url")
      .not("cover_url", "is", null)
      .range(offset, offset + 99)
      .order("id");

    if (error) {
      console.error("DB error:", error);
      break;
    }
    if (!books || books.length === 0) break;

    // Process in batches
    for (let i = 0; i < books.length; i += BATCH_SIZE) {
      const batch = books.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (book) => {
          const ok = await checkCover(book.cover_url);
          return { ...book, hasRealCover: ok };
        })
      );

      const blanks = results.filter((r) => !r.hasRealCover);
      if (blanks.length > 0) {
        const ids = blanks.map((b) => b.id);
        const { error: updateError } = await supabase
          .from("catalog_books")
          .update({ cover_url: null })
          .in("id", ids);

        if (updateError) {
          console.error("Update error:", updateError);
        } else {
          for (const b of blanks) {
            console.log(`  BLANK: [${b.id}] ${b.title}`);
          }
          totalBlanked += blanks.length;
        }
      }

      totalChecked += batch.length;
      process.stdout.write(`\rChecked ${totalChecked} books, blanked ${totalBlanked}...`);
    }

    offset += books.length;
    if (books.length < 100) break;
  }

  console.log(`\nDone! Checked ${totalChecked} books, nulled ${totalBlanked} blank covers.`);
}

main();
