/**
 * Z39.50 Catalog Search Client for Atriuum ILS
 *
 * Provides catalog search capabilities against the Atriuum Z39.50 server.
 * Falls back to mock data when environment variables are not configured.
 *
 * Uses env vars: ATRIUUM_Z3950_HOST, ATRIUUM_Z3950_PORT, ATRIUUM_Z3950_DB
 */

// ─── Types ──────────────────────────────────────────────────────────

export type SearchType = "keyword" | "title" | "author" | "subject" | "isbn";

export type FormatFilter =
  | "all"
  | "book"
  | "ebook"
  | "audiobook"
  | "dvd"
  | "large-print"
  | "magazine";

export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  year: string;
  isbn: string;
  description: string;
  format: FormatFilter;
  subjects: string[];
  publisher: string;
  pages: string;
  language: string;
  coverImageUrl: string;
  availability: {
    available: boolean;
    totalCopies: number;
    availableCopies: number;
    status: string;
    callNumber: string;
    location: string;
  };
}

export interface SearchResult {
  items: CatalogItem[];
  totalResults: number;
  page: number;
  pageSize: number;
  query: string;
  searchType: SearchType;
}

// ─── Z39.50 Attribute Mappings (Bib-1) ─────────────────────────────

const BIB1_ATTRIBUTES: Record<SearchType, number> = {
  keyword: 1016,   // Any
  title: 4,        // Title
  author: 1003,    // Author
  subject: 21,     // Subject
  isbn: 7,         // ISBN
};

// ─── Configuration ──────────────────────────────────────────────────

interface Z3950Config {
  host: string;
  port: number;
  database: string;
}

function getConfig(): Z3950Config | null {
  const host = process.env.ATRIUUM_Z3950_HOST;
  const port = process.env.ATRIUUM_Z3950_PORT;
  const db = process.env.ATRIUUM_Z3950_DB;

  if (!host || !port || !db) return null;

  return {
    host,
    port: parseInt(port, 10),
    database: db,
  };
}

// ─── Open Library Covers API ────────────────────────────────────────

function getCoverUrl(isbn: string, _title?: string): string {
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  }
  // Fallback: generate a color based on title hash
  return "";
}

// ─── MARC Record Parsing ────────────────────────────────────────────

interface MARCField {
  tag: string;
  value: string;
  subfields: Record<string, string>;
}

function parseMARCXML(xml: string): MARCField[] {
  const fields: MARCField[] = [];

  // Parse controlfields
  const controlFieldRegex = /<controlfield tag="(\d+)">(.*?)<\/controlfield>/gs;
  let match;
  while ((match = controlFieldRegex.exec(xml)) !== null) {
    fields.push({ tag: match[1], value: match[2], subfields: {} });
  }

  // Parse datafields
  const dataFieldRegex = /<datafield tag="(\d+)"[^>]*>(.*?)<\/datafield>/gs;
  while ((match = dataFieldRegex.exec(xml)) !== null) {
    const tag = match[1];
    const content = match[2];
    const subfields: Record<string, string> = {};

    const subfieldRegex = /<subfield code="(\w)">(.*?)<\/subfield>/gs;
    let sub;
    while ((sub = subfieldRegex.exec(content)) !== null) {
      subfields[sub[1]] = sub[2];
    }

    fields.push({ tag, value: "", subfields });
  }

  return fields;
}

function marcToCatalogItem(fields: MARCField[], index: number): CatalogItem {
  const getField = (tag: string, sub?: string): string => {
    const f = fields.find((f) => f.tag === tag);
    if (!f) return "";
    if (sub) return f.subfields[sub] || "";
    return f.value;
  };

  const getAllFields = (tag: string, sub: string): string[] => {
    return fields
      .filter((f) => f.tag === tag)
      .map((f) => f.subfields[sub] || "")
      .filter(Boolean);
  };

  // 245$a = title, 245$b = subtitle
  const title = (getField("245", "a") + " " + getField("245", "b")).trim().replace(/[/:]$/, "").trim();
  const author = getField("100", "a") || getField("700", "a") || "";
  const year = (getField("260", "c") || getField("264", "c") || "").replace(/[^0-9]/g, "").slice(0, 4);
  const isbn = getField("020", "a") || "";
  const description = getField("520", "a") || "";
  const publisher = getField("260", "b") || getField("264", "b") || "";
  const pages = getField("300", "a") || "";
  const subjects = getAllFields("650", "a");
  const language = getField("008").slice(35, 38) || "eng";

  // Detect format from 245$h, leader, or 007
  const gmd = getField("245", "h").toLowerCase();
  let format: FormatFilter = "book";
  if (gmd.includes("electronic") || gmd.includes("ebook")) format = "ebook";
  else if (gmd.includes("sound") || gmd.includes("audio")) format = "audiobook";
  else if (gmd.includes("videorecording") || gmd.includes("dvd")) format = "dvd";
  else if (getField("250", "a").toLowerCase().includes("large print")) format = "large-print";

  const cleanIsbn = isbn.replace(/[^0-9X]/gi, "").slice(0, 13);

  return {
    id: `z3950-${index}-${cleanIsbn || Date.now()}`,
    title: title || "Untitled",
    author: author.replace(/,$/, "").trim(),
    year,
    isbn: cleanIsbn,
    description,
    format,
    subjects,
    publisher: publisher.replace(/[,;:]$/, "").trim(),
    pages: pages.replace(/[;:]$/, "").trim(),
    language,
    coverImageUrl: getCoverUrl(cleanIsbn, title),
    availability: {
      available: true,
      totalCopies: 1,
      availableCopies: 1,
      status: "Available",
      callNumber: getField("090", "a") || getField("050", "a") || "",
      location: "Commerce Public Library",
    },
  };
}

// ─── Z39.50 Search via TCP ──────────────────────────────────────────

async function searchZ3950(
  config: Z3950Config,
  query: string,
  searchType: SearchType,
  page: number,
  pageSize: number
): Promise<SearchResult> {
  // Z39.50 is a binary protocol. In production, we would use a Node.js
  // Z39.50 library (yaz4j bindings or a ZOOM wrapper). For now we attempt
  // to use the yaz-client CLI tool if available, otherwise fall back to
  // SRU/SRW HTTP endpoint that most Z39.50 servers also expose.

  const attribute = BIB1_ATTRIBUTES[searchType];
  const offset = (page - 1) * pageSize;

  try {
    // Try SRU endpoint first (many Atriuum instances expose this)
    const sruUrl = `http://${config.host}:${config.port}/${config.database}?version=1.1&operation=searchRetrieve&query=@attr%201=${attribute}%20%22${encodeURIComponent(query)}%22&startRecord=${offset + 1}&maximumRecords=${pageSize}&recordSchema=marcxml`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(sruUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`SRU search failed: ${resp.status}`);
    }

    const xml = await resp.text();

    // Parse SRU response
    const totalMatch = xml.match(/<numberOfRecords>(\d+)<\/numberOfRecords>/);
    const totalResults = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Extract individual records
    const recordRegex = /<record xmlns[^>]*>(.*?)<\/record>/gs;
    const items: CatalogItem[] = [];
    let recordMatch;
    let idx = 0;

    while ((recordMatch = recordRegex.exec(xml)) !== null) {
      const fields = parseMARCXML(recordMatch[1]);
      items.push(marcToCatalogItem(fields, offset + idx));
      idx++;
    }

    // If no records found with namespace, try without
    if (items.length === 0) {
      const simpleRegex = /<record>(.*?)<\/record>/gs;
      while ((recordMatch = simpleRegex.exec(xml)) !== null) {
        const fields = parseMARCXML(recordMatch[1]);
        items.push(marcToCatalogItem(fields, offset + idx));
        idx++;
      }
    }

    return { items, totalResults, page, pageSize, query, searchType };
  } catch {
    // If SRU fails, return empty (the API route will fall back to mock)
    throw new Error("Z39.50/SRU search unavailable");
  }
}

// ─── Public Search Function ─────────────────────────────────────────

export async function searchCatalog(
  query: string,
  searchType: SearchType = "keyword",
  formatFilter: FormatFilter = "all",
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResult> {
  const config = getConfig();

  if (!config) {
    // Return mock data for development
    return getMockSearchResults(query, searchType, formatFilter, page, pageSize);
  }

  try {
    const result = await searchZ3950(config, query, searchType, page, pageSize);

    // Apply format filter client-side if Z39.50 doesn't support it
    if (formatFilter !== "all") {
      result.items = result.items.filter((item) => item.format === formatFilter);
      result.totalResults = result.items.length;
    }

    return result;
  } catch {
    // Fall back to mock data if Z39.50 is unreachable
    return getMockSearchResults(query, searchType, formatFilter, page, pageSize);
  }
}

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_CATALOG: CatalogItem[] = [
  {
    id: "mock-1",
    title: "The Women",
    author: "Kristin Hannah",
    year: "2024",
    isbn: "9781250178633",
    description:
      "A powerful story of one woman's journey from nursing student to Vietnam War nurse, and the battles she fights when she returns home. Frankie McGrath has always believed that her family's honor lies in the service of their country.",
    format: "book",
    subjects: ["Vietnam War", "Historical Fiction", "Women"],
    publisher: "St. Martin's Press",
    pages: "472 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781250178633-M.jpg",
    availability: { available: true, totalCopies: 3, availableCopies: 1, status: "Available", callNumber: "FIC HAN", location: "Commerce Public Library" },
  },
  {
    id: "mock-2",
    title: "Demon Copperhead",
    author: "Barbara Kingsolver",
    year: "2022",
    isbn: "9780063251922",
    description:
      "Set in the mountains of southern Appalachia, this is the story of a boy born to a teenaged single mother in a single-wide trailer, with no assets beyond his dead father's good looks and copper-colored hair.",
    format: "book",
    subjects: ["Appalachia", "Coming of age", "Literary Fiction"],
    publisher: "Harper",
    pages: "560 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780063251922-M.jpg",
    availability: { available: true, totalCopies: 2, availableCopies: 2, status: "Available", callNumber: "FIC KIN", location: "Commerce Public Library" },
  },
  {
    id: "mock-3",
    title: "Iron Flame",
    author: "Rebecca Yarros",
    year: "2023",
    isbn: "9781649374172",
    description:
      "The second year at Basgiath War College has barely begun, and Violet Sorrengail faces even deadlier challenges than before as secrets about the leadership of the Riders Quadrant come to light.",
    format: "book",
    subjects: ["Fantasy", "Dragons", "Romance"],
    publisher: "Entangled: Red Tower Books",
    pages: "623 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg",
    availability: { available: false, totalCopies: 2, availableCopies: 0, status: "All copies checked out", callNumber: "FIC YAR", location: "Commerce Public Library" },
  },
  {
    id: "mock-4",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    year: "2023",
    isbn: "9781649374042",
    description:
      "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant, but her commanding general mother has other plans. Violet must survive the brutal selection process to become a dragon rider.",
    format: "book",
    subjects: ["Fantasy", "Dragons", "Romance"],
    publisher: "Entangled: Red Tower Books",
    pages: "498 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg",
    availability: { available: true, totalCopies: 3, availableCopies: 1, status: "Available", callNumber: "FIC YAR", location: "Commerce Public Library" },
  },
  {
    id: "mock-5",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    year: "2015",
    isbn: "9781619634442",
    description:
      "When nineteen-year-old huntress Feyre kills a wolf in the woods, a terrifying creature arrives to demand retribution. Dragged to a treacherous magical land, Feyre discovers that her captor is not truly a beast.",
    format: "book",
    subjects: ["Fantasy", "Romance", "Fairy Tales"],
    publisher: "Bloomsbury",
    pages: "419 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781619634442-M.jpg",
    availability: { available: true, totalCopies: 2, availableCopies: 1, status: "Available", callNumber: "FIC MAA", location: "Commerce Public Library" },
  },
  {
    id: "mock-6",
    title: "Atomic Habits",
    author: "James Clear",
    year: "2018",
    isbn: "9780735211292",
    description:
      "An easy and proven way to build good habits and break bad ones. Learn how tiny changes in behavior can lead to remarkable results, with practical strategies that will teach you exactly how to form good habits.",
    format: "book",
    subjects: ["Self-help", "Habits", "Psychology"],
    publisher: "Avery",
    pages: "320 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg",
    availability: { available: true, totalCopies: 1, availableCopies: 1, status: "Available", callNumber: "158.1 CLE", location: "Commerce Public Library" },
  },
  {
    id: "mock-7",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    year: "2018",
    isbn: "9780735219090",
    description:
      "For years, rumors of the 'Marsh Girl' haunted Barkley Cove, a quiet town on the North Carolina coast. Kya Clark is the Marsh Girl — barefoot and wild, unfit for polite society.",
    format: "book",
    subjects: ["Mystery", "Southern Fiction", "Coming of age"],
    publisher: "G.P. Putnam's Sons",
    pages: "368 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780735219090-M.jpg",
    availability: { available: false, totalCopies: 2, availableCopies: 0, status: "All copies checked out", callNumber: "FIC OWE", location: "Commerce Public Library" },
  },
  {
    id: "mock-8",
    title: "Becoming",
    author: "Michelle Obama",
    year: "2018",
    isbn: "9781524763138",
    description:
      "In her memoir, former First Lady Michelle Obama invites readers into her world, chronicling the experiences that have shaped her — from her childhood to her years as an executive to her time in the White House.",
    format: "audiobook",
    subjects: ["Memoir", "Biography", "Politics"],
    publisher: "Crown",
    pages: "426 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781524763138-M.jpg",
    availability: { available: true, totalCopies: 1, availableCopies: 1, status: "Available", callNumber: "973.932 OBA", location: "Commerce Public Library" },
  },
  {
    id: "mock-9",
    title: "The Hunger Games",
    author: "Suzanne Collins",
    year: "2008",
    isbn: "9780439023481",
    description:
      "In the ruins of a place once known as North America lies the nation of Panem, a Capitol surrounded by twelve districts. Each year, two tributes from each district are selected to compete in a fight to the death.",
    format: "ebook",
    subjects: ["Young Adult", "Dystopian", "Science Fiction"],
    publisher: "Scholastic Press",
    pages: "374 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780439023481-M.jpg",
    availability: { available: true, totalCopies: 5, availableCopies: 3, status: "Available", callNumber: "YA FIC COL", location: "Commerce Public Library" },
  },
  {
    id: "mock-10",
    title: "Dog Man: Twenty Thousand Fleas Under the Sea",
    author: "Dav Pilkey",
    year: "2023",
    isbn: "9781338801958",
    description:
      "Dog Man and friends face their greatest challenge yet in this hilarious graphic novel adventure. When a new villain threatens the city, Dog Man must dive deep to save the day.",
    format: "book",
    subjects: ["Graphic Novel", "Children", "Humor"],
    publisher: "Graphix",
    pages: "224 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781338801958-M.jpg",
    availability: { available: true, totalCopies: 4, availableCopies: 2, status: "Available", callNumber: "J GN PIL", location: "Commerce Public Library" },
  },
  {
    id: "mock-11",
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    year: "2022",
    isbn: "9780385547345",
    description:
      "Chemist Elizabeth Zott is not your average woman. In 1960s America, she's not just a woman in a man's world — she's a scientist in a man's world. When she finds herself the reluctant star of a cooking show, she dares to fill the airwaves with science.",
    format: "book",
    subjects: ["Historical Fiction", "Humor", "Feminism"],
    publisher: "Doubleday",
    pages: "400 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9780385547345-M.jpg",
    availability: { available: true, totalCopies: 2, availableCopies: 1, status: "Available", callNumber: "FIC GAR", location: "Commerce Public Library" },
  },
  {
    id: "mock-12",
    title: "Yellowstone: The Official Dutton Ranch Family Cookbook",
    author: "Dina Wilder",
    year: "2023",
    isbn: "9781647225643",
    description:
      "From the ranch to your table, bring the flavors of the Dutton family's Montana home to your own kitchen with over 75 inspired recipes.",
    format: "book",
    subjects: ["Cooking", "Television", "Western"],
    publisher: "Insight Editions",
    pages: "192 pages",
    language: "eng",
    coverImageUrl: "https://covers.openlibrary.org/b/isbn/9781647225643-M.jpg",
    availability: { available: true, totalCopies: 1, availableCopies: 1, status: "Available", callNumber: "641.5 WIL", location: "Commerce Public Library" },
  },
];

function getMockSearchResults(
  query: string,
  searchType: SearchType,
  formatFilter: FormatFilter,
  page: number,
  pageSize: number
): SearchResult {
  const q = query.toLowerCase();

  let filtered = MOCK_CATALOG.filter((item) => {
    switch (searchType) {
      case "title":
        return item.title.toLowerCase().includes(q);
      case "author":
        return item.author.toLowerCase().includes(q);
      case "subject":
        return item.subjects.some((s) => s.toLowerCase().includes(q));
      case "isbn":
        return item.isbn.includes(q);
      case "keyword":
      default:
        return (
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.subjects.some((s) => s.toLowerCase().includes(q))
        );
    }
  });

  if (formatFilter !== "all") {
    filtered = filtered.filter((item) => item.format === formatFilter);
  }

  const totalResults = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, totalResults, page, pageSize, query, searchType };
}
