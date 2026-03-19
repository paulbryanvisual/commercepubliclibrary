export const siteSettingsSchema = {
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    { name: "libraryName", title: "Library Name", type: "string" },
    { name: "address", title: "Address", type: "string" },
    { name: "phone", title: "Phone", type: "string" },
    { name: "email", title: "Email", type: "string" },
    {
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        { name: "facebook", title: "Facebook URL", type: "url" },
        { name: "instagram", title: "Instagram URL", type: "url" },
        { name: "twitter", title: "Twitter URL", type: "url" },
      ],
    },
    {
      name: "alertBanner",
      title: "Alert Banner",
      type: "object",
      fields: [
        { name: "message", title: "Message", type: "string" },
        { name: "active", title: "Active", type: "boolean", initialValue: false },
        {
          name: "type",
          title: "Type",
          type: "string",
          options: { list: ["info", "warning", "closure"] },
          initialValue: "info",
        },
      ],
    },
  ],
};
