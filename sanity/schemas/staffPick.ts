export const staffPickSchema = {
  name: "staffPick",
  title: "Staff Pick",
  type: "document",
  fields: [
    { name: "bookTitle", title: "Book Title", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "author", title: "Author", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "isbn", title: "ISBN", type: "string" },
    { name: "quote", title: "Staff Quote", type: "text" },
    { name: "librarianName", title: "Librarian Name", type: "string" },
    { name: "coverImage", title: "Cover Image", type: "image" },
    { name: "dateAdded", title: "Date Added", type: "datetime" },
    { name: "active", title: "Active", type: "boolean", initialValue: true },
  ],
};
