/**
 * Backfill missing covers and descriptions from Google Books API.
 * Saves everything to our DB so we don't rely on external APIs at runtime.
 *
 * Run with: node scripts/backfill-google-books.mjs
 *
 * Options:
 *   --covers-only    Only backfill missing covers
 *   --desc-only      Only backfill missing descriptions
 *   --limit=N        Process at most N books (default: all)
 *   --dry-run        Don't write to DB, just log what would be updated
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = 5; // concurrent Google API requests (be nice)
const DELAY_MS = 500; // delay between batches to avoid rate limits
const args = process.argv.slice(2);
const coversOnly = args.includes("--covers-only");
const descOnly = args.includes("--desc-only");
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const maxLimit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

async function lookupGoogleBook(isbn, title, author) {
  let q = "";
  if (isbn) {
    q = `isbn:${isbn}`;
  } else if (title) {
    q = `intitle:${title}`;
    if (author) q += `+inauthor:${author}`;
  } else {
    return { coverUrl: null, description: null };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1&fields=items(volumeInfo)`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return { coverUrl: null, description: null };

    const data = await res.json();
    const vol = data.items?.[0]?.volumeInfo;
    if (!vol) return { coverUrl: null, description: null };

    let coverUrl = null;
    const imgs = vol.imageLinks;
    if (imgs) {
      const raw =
        imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail || imgs.smallThumbnail;
      if (raw) {
        coverUrl = raw.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
      }
    }

    let description = vol.description || null;
    if (description) {
      description = description.replace(/<[^>]+>/g, "");
      description = description
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
      if (description.length > 1500) {
        description = description.slice(0, 1500).replace(/\s\S*$/, "") + "...";
      }
    }

    return { coverUrl, description };
  } catch {
    return { coverUrl: null, description: null };
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Backfilling from Google Books API...`);
  if (dryRun) console.log("(DRY RUN — no DB writes)");
  if (coversOnly) console.log("(Covers only)");
  if (descOnly) console.log("(Descriptions only)");

  let offset = 0;
  let totalProcessed = 0;
  let coversFound = 0;
  let descriptionsFound = 0;

  while (totalProcessed < maxLimit) {
    // Fetch books that need covers OR descriptions
    let query = supabase
      .from("catalog_books")
      .select("id, isbn, title, author, cover_url, description")
      .order("id");

    if (coversOnly) {
      query = query.is("cover_url", null);
    } else if (descOnly) {
      query = query.is("description", null);
    } else {
      // Get books missing either cover or description
      query = query.or("cover_url.is.null,description.is.null");
    }

    query = query.range(offset, offset + 99);

    const { data: books, error } = await query;
    if (error) {
      console.error("DB error:", error);
      break;
    }
    if (!books || books.length === 0) break;

    // Process in small batches
    for (let i = 0; i < books.length && totalProcessed < maxLimit; i += BATCH_SIZE) {
      const batch = books.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (book) => {
          const gbook = await lookupGoogleBook(book.isbn, book.title, book.author);
          return { book, gbook };
        }),
      );

      for (const { book, gbook } of results) {
        const updates = {};

        // Backfill cover if missing
        if (!coversOnly || !book.cover_url) {
          if (!book.cover_url && gbook.coverUrl) {
            updates.cover_url = gbook.coverUrl;
            coversFound++;
            console.log(`  COVER: [${book.id}] ${book.title}`);
          }
        }

        // Backfill description if missing
        if (!descOnly || !book.description) {
          if (!book.description && gbook.description) {
            updates.description = gbook.description;
            descriptionsFound++;
            console.log(`  DESC:  [${book.id}] ${book.title}`);
          }
        }

        if (Object.keys(updates).length > 0 && !dryRun) {
          const { error: updateError } = await supabase
            .from("catalog_books")
            .update(updates)
            .eq("id", book.id);
          if (updateError) {
            console.error(`  ERROR updating ${book.id}:`, updateError);
          }
        }

        totalProcessed++;
      }

      process.stdout.write(
        `\rProcessed ${totalProcessed} books — covers: ${coversFound}, descriptions: ${descriptionsFound}...`,
      );

      // Rate-limit delay
      await sleep(DELAY_MS);
    }

    offset += books.length;
    if (books.length < 100) break;
  }

  console.log(
    `\n\nDone! Processed ${totalProcessed} books.` +
      `\n  Covers found:       ${coversFound}` +
      `\n  Descriptions found: ${descriptionsFound}`,
  );
}

main();
