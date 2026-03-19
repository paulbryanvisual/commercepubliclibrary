// Sanity schema — Event
// This file defines the schema. Sanity Studio integration comes in Phase 2.

export const eventSchema = {
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } },
    { name: "date", title: "Date & Time", type: "datetime", validation: (Rule: any) => Rule.required() },
    { name: "endDate", title: "End Date & Time", type: "datetime" },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    },
    {
      name: "shortDescription",
      title: "Short Description",
      type: "string",
      validation: (Rule: any) => Rule.max(140),
    },
    {
      name: "audience",
      title: "Audience",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Babies", value: "babies" },
          { title: "Toddlers", value: "toddlers" },
          { title: "Kids", value: "kids" },
          { title: "Tweens", value: "tweens" },
          { title: "Teens", value: "teens" },
          { title: "Adults", value: "adults" },
          { title: "Seniors", value: "seniors" },
          { title: "All Ages", value: "all" },
        ],
      },
    },
    { name: "image", title: "Image", type: "image", options: { hotspot: true } },
    {
      name: "location",
      title: "Location",
      type: "string",
      initialValue: "Commerce Public Library",
    },
    { name: "registrationRequired", title: "Registration Required", type: "boolean", initialValue: false },
    { name: "registrationUrl", title: "Registration URL", type: "url" },
    { name: "featured", title: "Featured", type: "boolean", initialValue: false },
  ],
};
