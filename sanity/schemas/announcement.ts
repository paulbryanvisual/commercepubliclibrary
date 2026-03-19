export const announcementSchema = {
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "body", title: "Body", type: "array", of: [{ type: "block" }] },
    { name: "publishDate", title: "Publish Date", type: "datetime" },
    { name: "expiryDate", title: "Expiry Date", type: "datetime" },
    {
      name: "priority",
      title: "Priority",
      type: "string",
      options: { list: ["normal", "urgent"] },
      initialValue: "normal",
    },
  ],
};
