/**
 * Seed the catalog_books table with thousands of books from Open Library.
 *
 * Run with:  npx tsx scripts/seed-catalog.ts
 *
 * Fetches popular books across many subjects/genres, deduplicates by title,
 * and upserts into Supabase.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const OL_SEARCH = "https://openlibrary.org/search.json";

interface GenreQuery {
  genre: string;
  queries: string[];
}

// Each genre has multiple search queries to get breadth
const genreQueries: GenreQuery[] = [
  {
    genre: "Fiction",
    queries: [
      "subject:fiction&sort=rating",
      "subject:literary fiction&sort=rating",
      "subject:contemporary fiction",
      "subject:historical fiction",
      "subject:fiction&sort=new",
      "subject:general fiction",
      "subject:domestic fiction",
      "subject:american fiction",
      "subject:british fiction",
      "subject:short stories",
    ],
  },
  {
    genre: "Mystery",
    queries: [
      "subject:mystery&sort=rating",
      "subject:thriller&sort=rating",
      "subject:crime fiction",
      "subject:detective fiction",
      "subject:suspense",
      "subject:mystery fiction",
      "subject:cozy mystery",
      "subject:legal thriller",
    ],
  },
  {
    genre: "Romance",
    queries: [
      "subject:romance&sort=rating",
      "subject:love stories",
      "subject:contemporary romance",
      "subject:historical romance",
      "subject:romantic suspense",
      "subject:romance fiction",
    ],
  },
  {
    genre: "Sci-Fi",
    queries: [
      "subject:science fiction&sort=rating",
      "subject:fantasy&sort=rating",
      "subject:space opera",
      "subject:dystopian",
      "subject:epic fantasy",
      "subject:urban fantasy",
      "subject:cyberpunk",
      "subject:fantasy fiction",
    ],
  },
  {
    genre: "Biography",
    queries: [
      "subject:biography&sort=rating",
      "subject:memoir&sort=rating",
      "subject:autobiography",
      "subject:biography & autobiography",
      "subject:personal memoirs",
      "subject:presidents",
    ],
  },
  {
    genre: "Kids",
    queries: [
      "subject:children's fiction&sort=rating",
      "subject:juvenile fiction&sort=rating",
      "subject:picture books",
      "subject:children's stories",
      "subject:middle grade",
      "subject:chapter books",
      "subject:graphic novels children",
    ],
  },
  {
    genre: "Teens",
    queries: [
      "subject:young adult fiction&sort=rating",
      "subject:young adult&sort=rating",
      "subject:teen fiction",
      "subject:YA fantasy",
      "subject:YA romance",
      "subject:young adult dystopian",
    ],
  },
  {
    genre: "Nonfiction",
    queries: [
      "subject:self-help&sort=rating",
      "subject:psychology&sort=rating",
      "subject:history&sort=rating",
      "subject:science&sort=rating",
      "subject:business",
      "subject:health",
      "subject:cooking",
      "subject:true crime",
      "subject:philosophy",
      "subject:nature",
    ],
  },
];

interface OLDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
}

interface BookRow {
  isbn: string | null;
  title: string;
  author: string | null;
  year: number | null;
  genre: string;
  description: string | null;
  subjects: string[];
  cover_url: string | null;
  publisher: string | null;
  pages: number | null;
  open_library_key: string | null;
}

async function fetchBooks(query: string, genre: string, limit = 50): Promise<BookRow[]> {
  // query format: "subject:fiction&sort=rating" -> split into q= and extra params
  const parts = query.split("&");
  const q = parts[0]; // e.g. "subject:fiction"
  const extraParams = parts.slice(1).join("&"); // e.g. "sort=rating"
  const url = `${OL_SEARCH}?q=${encodeURIComponent(q)}${extraParams ? "&" + extraParams : ""}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject,publisher,number_of_pages_median`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  Failed: ${query} (${res.status})`);
      return [];
    }
    const data = await res.json();
    const docs: OLDoc[] = data.docs || [];

    return docs
      .filter((d) => d.title && d.title.length > 1)
      .map((doc) => {
        const isbn =
          Array.isArray(doc.isbn) && doc.isbn.length > 0 ? doc.isbn[0] : null;
        const coverId = doc.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : isbn
            ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
            : null;

        return {
          isbn,
          title: doc.title!,
          author: Array.isArray(doc.author_name)
            ? doc.author_name.slice(0, 2).join(", ")
            : null,
          year: doc.first_publish_year || null,
          genre,
          description: null,
          subjects: Array.isArray(doc.subject)
            ? (doc.subject as string[]).slice(0, 8)
            : [],
          cover_url: coverUrl,
          publisher: Array.isArray(doc.publisher)
            ? (doc.publisher as string[])[0]
            : null,
          pages: doc.number_of_pages_median || null,
          open_library_key: (doc.key as string) || null,
        };
      });
  } catch (err) {
    console.warn(`  Error fetching ${query}:`, err);
    return [];
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Seeding catalog_books...\n");

  let totalInserted = 0;
  const seenTitles = new Set<string>();

  for (const gq of genreQueries) {
    console.log(`\n📚 ${gq.genre} (${gq.queries.length} queries)`);

    for (const query of gq.queries) {
      console.log(`  Fetching: ${query}`);
      const books = await fetchBooks(query, gq.genre, 50);

      // Deduplicate by title (case-insensitive)
      const unique = books.filter((b) => {
        const key = b.title.toLowerCase().trim();
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });

      if (unique.length === 0) {
        console.log(`    No new books`);
        await sleep(300);
        continue;
      }

      // Insert books one by one, skipping duplicates
      let batchInserted = 0;
      for (const book of unique) {
        const { error: insertError } = await sb
          .from("catalog_books")
          .insert(book);
        if (insertError) {
          if (insertError.code === "23505") {
            // Duplicate — skip
          } else {
            console.warn(`    Insert error for "${book.title}":`, insertError.message);
          }
        } else {
          batchInserted++;
        }
      }
      console.log(`    Inserted ${batchInserted} of ${unique.length} books`);
      totalInserted += batchInserted;

      // Rate limit: Open Library asks for <1 req/sec
      await sleep(1100);
    }
  }

  console.log(`\n✅ Done! Total new books added: ${totalInserted}`);
  console.log(`   Total unique titles seen: ${seenTitles.size}`);

  // Print counts per genre
  const { data: counts } = await sb
    .from("catalog_books")
    .select("genre")
    .limit(10000);

  if (counts) {
    const byGenre: Record<string, number> = {};
    for (const row of counts) {
      byGenre[row.genre] = (byGenre[row.genre] || 0) + 1;
    }
    console.log("\n📊 Books per genre:");
    for (const [genre, count] of Object.entries(byGenre).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`   ${genre}: ${count}`);
    }
    console.log(
      `   TOTAL: ${Object.values(byGenre).reduce((a, b) => a + b, 0)}`
    );
  }
}

main().catch(console.error);
