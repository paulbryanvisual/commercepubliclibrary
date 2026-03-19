export const hoursSchema = {
  name: "hours",
  title: "Library Hours",
  type: "document",
  fields: [
    {
      name: "weeklyHours",
      title: "Weekly Hours",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "day", title: "Day", type: "string" },
            { name: "openTime", title: "Open Time", type: "string" },
            { name: "closeTime", title: "Close Time", type: "string" },
            { name: "closed", title: "Closed", type: "boolean", initialValue: false },
          ],
        },
      ],
    },
    {
      name: "specialClosures",
      title: "Special Closures",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "date", title: "Date", type: "date" },
            { name: "reason", title: "Reason", type: "string" },
          ],
        },
      ],
    },
    {
      name: "holidayHours",
      title: "Holiday Hours",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "date", title: "Date", type: "date" },
            { name: "openTime", title: "Open Time", type: "string" },
            { name: "closeTime", title: "Close Time", type: "string" },
          ],
        },
      ],
    },
  ],
};
