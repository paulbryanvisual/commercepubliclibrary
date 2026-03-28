/**
 * Content filtering for the catalog.
 *
 * Books on the frequently-challenged/banned lists and books with NSFW
 * content are hidden from browse, discovery, quiz, and surprise-me
 * features. They still appear when a patron explicitly searches for them.
 *
 * Sources for the banned-books list:
 * - ALA Office for Intellectual Freedom "Top 100 Banned/Challenged Books" (2010–2019, 2020–2024)
 * - PEN America Index of School Book Bans (2021–2024)
 * - Texas State Library frequently-challenged titles
 *
 * NOTE: We are NOT endorsing the banning of any book. This filter exists
 * only so that the library's public-facing browse & discovery experience
 * stays uncontroversial and family-friendly by default. Every title
 * remains fully searchable and available.
 */

// ---------- Frequently challenged / banned books ----------
// Normalized to lowercase for matching.
const BANNED_TITLES: Set<string> = new Set([
  // ALA Top Challenged 2020-2024
  "gender queer: a memoir",
  "gender queer",
  "all boys aren't blue",
  "flamer",
  "the bluest eye",
  "looking for alaska",
  "me and earl and the dying girl",
  "this book is gay",
  "beyond magenta",
  "lawn boy",
  "the perks of being a wallflower",
  "the absolutely true diary of a part-time indian",
  "a court of mist and fury",
  "a court of thorns and roses",
  "a court of wings and ruin",
  "a court of silver flames",
  "out of darkness",
  "the kite runner",
  "crank",
  "sold",
  "push",
  "it's perfectly normal",
  "sex is a funny word",
  "let's talk about it",
  "what girls are made of",
  "forever",
  "forever...",
  "judy blume's forever",
  "thirteen reasons why",
  "the handmaid's tale",
  "beloved",
  "the color purple",
  "speak",
  "tricks",
  "identical",
  "burned",
  "glass",
  "impulse",
  "perfect",
  "i know why the caged bird sings",
  "go ask alice",
  "a stolen life",
  "fifty shades of grey",
  "fifty shades darker",
  "fifty shades freed",
  "the curious incident of the dog in the night-time",
  "two boys kissing",
  "drama",
  "and tango makes three",
  "this one summer",
  "my princess boy",
  "i am jazz",
  "george",
  "melissa",
  "in the night kitchen",
  "the glass castle",
  "a child called \"it\"",
  "a child called it",
  "go tell it on the mountain",
  "the hate u give",
  "dear martin",
  "stamped: racism, antiracism, and you",
  "stamped from the beginning",
  "between the world and me",
  "how to be an antiracist",
  "antiracist baby",
  "critical race theory",
  "not my idea",
  "something happened in our town",
  "the 1619 project",
  "new kid",
  "born a crime",
  "the catcher in the rye",
  "of mice and men",
  "brave new world",
  "slaughterhouse-five",
  "the great gatsby",
  "lord of the flies",
  "invisible man",
  "native son",
  "their eyes were watching god",
  "a separate peace",
  "catch-22",
  "one flew over the cuckoo's nest",
  "as i lay dying",
  "the adventures of huckleberry finn",
  "the grapes of wrath",
  "for whom the bell tolls",
  "call of the wild",
  "fahrenheit 451",
  "a clockwork orange",
  "the giver",
  "bridge to terabithia",
  "my mom's having a baby",
  "uncle bobby's wedding",
  "heather has two mommies",
  "daddy's roommate",
  "king & king",
  "prince & knight",
  "jacob's new dress",
  "red: a crayon's story",
  "the family book",
  "it's so amazing",
  "sex ed",
  "changing bodies, changing lives",
  "lucky",
  "the lovely bones",
  "wintergirls",
  "cut",
  "tweak",
  "beautiful boy",
  "my sister's keeper",
  "the house of the spirits",
  "like water for chocolate",
  "bless me, ultima",
  "the house on mango street",
  "the joy luck club",
  "nickel and dimed",
  "the things they carried",
  "fallen angels",
  "monster",
  "unwind",
  "the fault in our stars",
  "eleanor & park",
  "tilt",
  "me earl and the dying girl",
  "milk and honey",
  "the body keeps the score",
]);

// ---------- NSFW subject / keyword detection ----------
// If a book's subjects contain any of these, it's hidden from browse.
const NSFW_SUBJECT_KEYWORDS: string[] = [
  "erotica",
  "erotic fiction",
  "erotic romance",
  "pornography",
  "adult romance",
  "sexual content",
  "explicit",
  "bdsm",
  "sexual fantasy",
  "sexual fiction",
];

// ---------- Public API ----------

/**
 * Returns true if the book should be hidden from browse/discovery.
 * It will still appear in explicit search results.
 */
export function shouldFilterBook(
  title: string,
  subjects?: string[],
): boolean {
  // Check banned title list
  const normalizedTitle = title.toLowerCase().trim();
  if (BANNED_TITLES.has(normalizedTitle)) return true;

  // Check for partial matches (series, subtitles, etc.)
  for (const banned of BANNED_TITLES) {
    if (normalizedTitle.startsWith(banned + ":") || normalizedTitle.startsWith(banned + " -")) {
      return true;
    }
  }

  // Check NSFW subjects
  if (subjects && subjects.length > 0) {
    const subjectsLower = subjects.map((s) => s.toLowerCase());
    for (const keyword of NSFW_SUBJECT_KEYWORDS) {
      if (subjectsLower.some((s) => s.includes(keyword))) return true;
    }
  }

  return false;
}

/**
 * Filter an array of books, removing those that should be hidden.
 * T must have at least { title: string; subjects?: string[] }.
 */
export function filterBooks<T extends { title: string; subjects?: string[] }>(
  books: T[],
): T[] {
  return books.filter((b) => !shouldFilterBook(b.title, b.subjects));
}
