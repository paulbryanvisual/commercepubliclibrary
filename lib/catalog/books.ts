import { filterBooks } from "./content-filter";

export type Genre =
  | "Fiction"
  | "Mystery"
  | "Romance"
  | "Sci-Fi"
  | "Biography"
  | "Kids"
  | "Teens"
  | "Nonfiction"
  | "Early Childhood"
  | "DVD";

export interface Book {
  isbn: string;
  title: string;
  author: string;
  year: number;
  genre: Genre;
  description: string;
  subjects: string[];
  coverUrl: string;
}

function bookWithCover(book: Omit<Book, "coverUrl">): Book {
  const externalUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
  return {
    ...book,
    coverUrl: `/api/catalog/image-proxy?url=${encodeURIComponent(externalUrl)}`,
  };
}

export const books: Book[] = [
  // Fiction
  bookWithCover({
    isbn: "9781250178619",
    title: "The Women",
    author: "Kristin Hannah",
    year: 2024,
    genre: "Fiction",
    description:
      "A powerful story of one woman's journey from nursing student to Vietnam War nurse and the battles she fights upon returning home. Hannah delivers an unforgettable portrait of courage amid chaos.",
    subjects: ["historical fiction", "war", "women", "Vietnam"],
  }),
  bookWithCover({
    isbn: "9781649374042",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    year: 2023,
    genre: "Fiction",
    description:
      "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant, but instead she's thrust into the deadly world of dragon riders. A thrilling fantasy romance full of danger and intrigue.",
    subjects: ["fantasy", "dragons", "romance", "military"],
  }),
  bookWithCover({
    isbn: "9781476754468",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    year: 2022,
    genre: "Fiction",
    description:
      "Two friends find their lives intertwined through decades of making video games together. A dazzling novel about identity, disability, failure, and the redemptive power of play.",
    subjects: ["friendship", "video games", "creativity", "contemporary"],
  }),
  bookWithCover({
    isbn: "9780061120084",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    genre: "Fiction",
    description:
      "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Scout Finch watches her father defend a Black man accused of a terrible crime.",
    subjects: ["classic", "racism", "justice", "coming of age", "Southern"],
  }),
  bookWithCover({
    isbn: "9780451524935",
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "Fiction",
    description:
      "In a totalitarian future society, Winston Smith struggles against the omnipresent surveillance of Big Brother. Orwell's chilling dystopia remains one of the most powerful warnings ever issued.",
    subjects: ["classic", "dystopia", "politics", "surveillance"],
  }),
  bookWithCover({
    isbn: "9780141439518",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: 1813,
    genre: "Romance",
    description:
      "The turbulent relationship between Elizabeth Bennet and Mr. Darcy is one of literature's great love stories. Austen's wit and social commentary remain as sharp and delightful as ever.",
    subjects: ["classic", "romance", "British", "social class"],
  }),

  // Mystery / Thriller
  bookWithCover({
    isbn: "9781250301697",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    year: 2019,
    genre: "Mystery",
    description:
      "Alicia Berenson shoots her husband and then never speaks another word. Theo Faber, a criminal psychotherapist, is determined to unravel the mystery of her silence.",
    subjects: ["thriller", "psychological", "suspense", "crime"],
  }),
  bookWithCover({
    isbn: "9780307588371",
    title: "Gone Girl",
    author: "Gillian Flynn",
    year: 2012,
    genre: "Mystery",
    description:
      "On their fifth wedding anniversary, Amy Dunne disappears and all eyes turn to husband Nick. A twisting, dark tale of a marriage gone terribly wrong.",
    subjects: ["thriller", "psychological", "marriage", "suspense"],
  }),
  bookWithCover({
    isbn: "9780593419052",
    title: "The Housemaid",
    author: "Freida McFadden",
    year: 2022,
    genre: "Mystery",
    description:
      "Millie takes a live-in housemaid position for the wealthy Winchester family, but soon discovers the family's dark secrets. Nothing in this house is what it seems.",
    subjects: ["thriller", "suspense", "domestic", "psychological"],
  }),
  bookWithCover({
    isbn: "9780525559474",
    title: "The Maid",
    author: "Nita Prose",
    year: 2022,
    genre: "Mystery",
    description:
      "Molly Gray is a hotel maid who discovers a dead body in one of the rooms. As suspicion mounts against her, she must find the real killer to clear her name.",
    subjects: ["cozy mystery", "hotel", "suspense", "neurodivergent"],
  }),

  // Romance
  bookWithCover({
    isbn: "9781668001226",
    title: "It Ends with Us",
    author: "Colleen Hoover",
    year: 2016,
    genre: "Romance",
    description:
      "Lily hasn't always had it easy, but that's never stopped her from working hard. A brave and heartbreaking novel about relationships and the choices we make.",
    subjects: ["contemporary romance", "domestic abuse", "relationships"],
  }),
  bookWithCover({
    isbn: "9780349429717",
    title: "Beach Read",
    author: "Emily Henry",
    year: 2020,
    genre: "Romance",
    description:
      "A romance writer who no longer believes in love and a literary fiction author stuck in a rut swap genres for the summer. Witty, heartfelt, and full of surprises.",
    subjects: ["contemporary romance", "writers", "humor", "summer"],
  }),

  // Sci-Fi
  bookWithCover({
    isbn: "9780593135204",
    title: "Project Hail Mary",
    author: "Andy Weir",
    year: 2021,
    genre: "Sci-Fi",
    description:
      "Ryland Grace is the sole survivor on a desperate mission to save Earth. With only an alien companion and his wits, he must solve an impossible scientific mystery.",
    subjects: ["space", "science", "alien contact", "survival"],
  }),
  bookWithCover({
    isbn: "9780441013593",
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, Dune is the story of Paul Atreides and his family's battle for control of the most valuable resource in the universe. A towering masterpiece of science fiction.",
    subjects: ["classic", "space", "politics", "desert", "ecology"],
  }),
  bookWithCover({
    isbn: "9781101967317",
    title: "The Three-Body Problem",
    author: "Liu Cixin",
    year: 2008,
    genre: "Sci-Fi",
    description:
      "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space, making first contact with an alien civilization on the brink of destruction.",
    subjects: ["hard sci-fi", "alien contact", "physics", "China"],
  }),
  bookWithCover({
    isbn: "9780316769488",
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    year: 1979,
    genre: "Sci-Fi",
    description:
      "Seconds before Earth is demolished, Arthur Dent is plucked off the planet by his friend Ford Prefect. A hilarious and beloved adventure through space.",
    subjects: ["classic", "humor", "space", "adventure"],
  }),

  // Biography / Memoir
  bookWithCover({
    isbn: "9780399590504",
    title: "Educated",
    author: "Tara Westover",
    year: 2018,
    genre: "Biography",
    description:
      "Born to survivalists in the mountains of Idaho, Tara Westover was kept out of school. Her quest for knowledge took her to Harvard and Cambridge. A stunning memoir of resilience.",
    subjects: ["memoir", "education", "family", "resilience"],
  }),
  bookWithCover({
    isbn: "9780525559535",
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    year: 1947,
    genre: "Biography",
    description:
      "The diary of a young Jewish girl hiding from the Nazis during World War II. Anne Frank's words remain a powerful testament to the human spirit.",
    subjects: ["memoir", "Holocaust", "WWII", "classic"],
  }),
  bookWithCover({
    isbn: "9781524763138",
    title: "Becoming",
    author: "Michelle Obama",
    year: 2018,
    genre: "Biography",
    description:
      "In her memoir, the former First Lady describes her roots on the South Side of Chicago and her journey to the White House. An intimate and inspiring story.",
    subjects: ["memoir", "politics", "women", "inspiration"],
  }),

  // Kids
  bookWithCover({
    isbn: "9781419711329",
    title: "Diary of a Wimpy Kid",
    author: "Jeff Kinney",
    year: 2007,
    genre: "Kids",
    description:
      "Greg Heffley's hilarious journal chronicles his attempts to survive middle school. Filled with cartoons and laugh-out-loud misadventures that kids everywhere relate to.",
    subjects: ["humor", "middle school", "diary", "illustrated"],
  }),
  bookWithCover({
    isbn: "9781338741032",
    title: "Dog Man: Twenty Thousand Fleas Under the Sea",
    author: "Dav Pilkey",
    year: 2023,
    genre: "Kids",
    description:
      "The adventures of Dog Man continue in this action-packed graphic novel. With his heroic heart and canine instincts, Dog Man faces his biggest challenge yet.",
    subjects: ["graphic novel", "humor", "superheroes", "illustrated"],
  }),
  bookWithCover({
    isbn: "9780590353427",
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    year: 1997,
    genre: "Kids",
    description:
      "Harry Potter discovers on his eleventh birthday that he is a wizard and is invited to attend Hogwarts School of Witchcraft and Wizardry. The beginning of a magical journey.",
    subjects: ["fantasy", "magic", "friendship", "adventure", "classic"],
  }),
  bookWithCover({
    isbn: "9780786838653",
    title: "Percy Jackson & the Lightning Thief",
    author: "Rick Riordan",
    year: 2005,
    genre: "Kids",
    description:
      "Twelve-year-old Percy Jackson discovers he's the son of Poseidon and must prevent a war among the gods. An action-packed adventure rooted in Greek mythology.",
    subjects: ["mythology", "adventure", "fantasy", "Greek gods"],
  }),

  // Teens / YA
  bookWithCover({
    isbn: "9780439023481",
    title: "The Hunger Games",
    author: "Suzanne Collins",
    year: 2008,
    genre: "Teens",
    description:
      "In a dark future, Katniss Everdeen volunteers to take her sister's place in a televised fight to the death. A gripping tale of survival, rebellion, and courage.",
    subjects: ["dystopia", "survival", "rebellion", "adventure"],
  }),
  bookWithCover({
    isbn: "9780062024039",
    title: "Divergent",
    author: "Veronica Roth",
    year: 2011,
    genre: "Teens",
    description:
      "In a society divided into factions based on virtues, Tris discovers she doesn't fit into any one group. Her divergence threatens to expose a growing conflict.",
    subjects: ["dystopia", "identity", "adventure", "rebellion"],
  }),
  bookWithCover({
    isbn: "9781338283037",
    title: "The Hate U Give",
    author: "Angie Thomas",
    year: 2017,
    genre: "Teens",
    description:
      "Sixteen-year-old Starr witnesses the fatal shooting of her childhood best friend by a police officer. Inspired by the Black Lives Matter movement, it's a searing and unforgettable novel.",
    subjects: ["social justice", "racism", "contemporary", "activism"],
  }),

  // Nonfiction
  bookWithCover({
    isbn: "9780735211292",
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    genre: "Nonfiction",
    description:
      "A proven framework for improving every day. Clear reveals practical strategies for forming good habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results.",
    subjects: ["self-help", "habits", "productivity", "psychology"],
  }),
  bookWithCover({
    isbn: "9780593654408",
    title: "The Body Keeps the Score",
    author: "Bessel van der Kolk",
    year: 2014,
    genre: "Nonfiction",
    description:
      "A pioneering researcher transforms our understanding of traumatic stress. This groundbreaking book reveals how trauma reshapes the body and brain, and offers new paths to recovery.",
    subjects: ["psychology", "trauma", "health", "neuroscience"],
  }),
  bookWithCover({
    isbn: "9780593237465",
    title: "Braiding Sweetgrass",
    author: "Robin Wall Kimmerer",
    year: 2013,
    genre: "Nonfiction",
    description:
      "Drawing on her life as an indigenous scientist, Kimmerer shows how other living beings offer us gifts and lessons. A beautiful weaving of indigenous wisdom and scientific knowledge.",
    subjects: ["nature", "indigenous", "science", "ecology", "spirituality"],
  }),
];

/** Books filtered for browse/discovery (banned/NSFW removed) */
export const browsableBooks: Book[] = filterBooks(books);

export const genres: Genre[] = [
  "Fiction",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Biography",
  "Kids",
  "Teens",
  "Nonfiction",
  "Early Childhood",
  "DVD",
];

export function getBookByIsbn(isbn: string): Book | undefined {
  return books.find((b) => b.isbn === isbn);
}

export function getBooksByGenre(genre: Genre): Book[] {
  return browsableBooks.filter((b) => b.genre === genre);
}

export function getRelatedBooks(book: Book, limit = 6): Book[] {
  const scored = books
    .filter((b) => b.isbn !== book.isbn)
    .map((b) => {
      let score = 0;
      if (b.genre === book.genre) score += 3;
      const shared = b.subjects.filter((s) => book.subjects.includes(s));
      score += shared.length * 2;
      return { book: b, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.book);
}
