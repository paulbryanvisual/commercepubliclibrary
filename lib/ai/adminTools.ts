/**
 * Tool definitions for the Admin AI Chat — Claude API tool_use format.
 * Each tool describes an action the AI can take on behalf of library staff.
 */

import type Anthropic from "@anthropic-ai/sdk";

export const adminTools: Anthropic.Tool[] = [
  /* ───── Events ───── */
  {
    name: "create_event",
    description:
      "Create a new library event. Returns a preview card the staff member can approve before publishing.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The event title, e.g. 'Preschool Story Time'",
        },
        date: {
          type: "string",
          description: "ISO 8601 date string, e.g. '2026-03-21'",
        },
        start_time: {
          type: "string",
          description: "Start time in HH:mm (24-hr), e.g. '10:00'",
        },
        end_time: {
          type: "string",
          description: "End time in HH:mm (24-hr), e.g. '11:00'",
        },
        description: {
          type: "string",
          description: "A short description of the event (1-3 sentences)",
        },
        audience: {
          type: "string",
          enum: ["all_ages", "kids", "teens", "adults", "seniors"],
          description: "Target audience",
        },
        location: {
          type: "string",
          description:
            "Location within or outside the library. Defaults to 'Commerce Public Library'",
        },
        recurring: {
          type: "string",
          enum: ["none", "weekly", "biweekly", "monthly"],
          description: "Recurrence pattern. Defaults to 'none'",
        },
        image_url: {
          type: "string",
          description: "Optional URL of an image to attach to the event",
        },
      },
      required: ["title", "date", "start_time", "description", "audience"],
    },
  },
  {
    name: "update_event",
    description:
      "Update an existing library event by its ID. Only include the fields you want to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "string",
          description: "The unique event ID to update",
        },
        title: { type: "string", description: "New title" },
        date: { type: "string", description: "New date (ISO 8601)" },
        start_time: { type: "string", description: "New start time (HH:mm)" },
        end_time: { type: "string", description: "New end time (HH:mm)" },
        description: { type: "string", description: "New description" },
        audience: {
          type: "string",
          enum: ["all_ages", "kids", "teens", "adults", "seniors"],
        },
        location: { type: "string" },
        cancelled: {
          type: "boolean",
          description: "Set true to cancel the event",
        },
      },
      required: ["event_id"],
    },
  },
  {
    name: "delete_event",
    description:
      "Delete an event permanently. Requires confirmation from the staff member before executing.",
    input_schema: {
      type: "object" as const,
      properties: {
        event_id: {
          type: "string",
          description: "The unique event ID to delete",
        },
        confirm: {
          type: "boolean",
          description:
            "Must be true to proceed. Ask the user for confirmation first.",
        },
      },
      required: ["event_id", "confirm"],
    },
  },

  /* ───── Announcements ───── */
  {
    name: "create_announcement",
    description:
      "Create a news announcement or alert banner for the library website.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Announcement headline",
        },
        body: {
          type: "string",
          description:
            "The full announcement body text. May include basic formatting.",
        },
        type: {
          type: "string",
          enum: ["news", "alert", "closure", "celebration"],
          description: "The announcement type — determines styling on the site",
        },
        starts_at: {
          type: "string",
          description:
            "When to start showing. ISO 8601 datetime. Defaults to now.",
        },
        expires_at: {
          type: "string",
          description: "When to stop showing. ISO 8601 datetime. Optional.",
        },
        pinned: {
          type: "boolean",
          description:
            "If true, the announcement stays at the top of the page",
        },
      },
      required: ["title", "body", "type"],
    },
  },

  {
    name: "delete_announcement",
    description: "Delete an announcement permanently by its ID. Always confirm with the user first.",
    input_schema: {
      type: "object" as const,
      properties: {
        announcement_id: { type: "string", description: "The UUID of the announcement to delete" },
        confirm: { type: "boolean", description: "Must be true to proceed" },
      },
      required: ["announcement_id", "confirm"],
    },
  },

  /* ───── Hours & Closures ───── */
  {
    name: "update_hours",
    description:
      "Update the library's regular operating hours for one or more days of the week.",
    input_schema: {
      type: "object" as const,
      properties: {
        hours: {
          type: "array",
          description: "Array of day-hour entries to update",
          items: {
            type: "object",
            properties: {
              day: {
                type: "string",
                enum: [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ],
              },
              open: {
                type: "string",
                description: "Opening time HH:mm, e.g. '09:00'",
              },
              close: {
                type: "string",
                description: "Closing time HH:mm, e.g. '18:00'",
              },
              closed: {
                type: "boolean",
                description: "Set true if the library is closed that day",
              },
            },
            required: ["day"],
          },
        },
        effective_date: {
          type: "string",
          description:
            "When the new hours take effect (ISO 8601). Defaults to immediately.",
        },
      },
      required: ["hours"],
    },
  },
  {
    name: "delete_closure",
    description: "Delete a closure permanently by its ID. Always confirm with the user first.",
    input_schema: {
      type: "object" as const,
      properties: {
        closure_id: { type: "string", description: "The UUID of the closure to delete" },
        confirm: { type: "boolean", description: "Must be true to proceed" },
      },
      required: ["closure_id", "confirm"],
    },
  },
  {
    name: "add_closure",
    description:
      "Add a temporary closure or special hours for a specific date or date range (holidays, weather, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Reason for closure, e.g. 'Independence Day'",
        },
        start_date: {
          type: "string",
          description: "First date of closure (ISO 8601)",
        },
        end_date: {
          type: "string",
          description:
            "Last date of closure (ISO 8601). Same as start_date if single day.",
        },
        special_hours: {
          type: "string",
          description:
            "If not fully closed, the special hours string, e.g. '10am-2pm'",
        },
        message: {
          type: "string",
          description: "Optional public-facing message about the closure",
        },
      },
      required: ["title", "start_date", "end_date"],
    },
  },

  /* ───── Staff Picks ───── */
  {
    name: "create_staff_pick",
    description:
      "Add a new staff pick / recommended book to the website.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Book title" },
        author: { type: "string", description: "Author name" },
        isbn: {
          type: "string",
          description: "ISBN (10 or 13 digit) for cover lookup",
        },
        staff_name: {
          type: "string",
          description: "Name of the staff member recommending it",
        },
        review: {
          type: "string",
          description:
            "A short review or blurb (1-3 sentences) about why staff recommends it",
        },
        category: {
          type: "string",
          enum: [
            "fiction",
            "non_fiction",
            "kids",
            "teens",
            "mystery",
            "romance",
            "sci_fi",
            "biography",
          ],
          description: "Genre/category",
        },
        image_url: {
          type: "string",
          description: "Optional URL for a custom cover image",
        },
      },
      required: ["title", "author", "staff_name", "review", "category"],
    },
  },

  /* ───── Page Content ───── */
  {
    name: "update_page_content",
    description:
      "Update a section of content on any page of the website. Also used to set images/photos on any page — pass the image URL as the content value. Returns a before/after preview.",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          description:
            "The page slug, e.g. 'home', 'about', 'services', 'kids', 'history'",
        },
        section: {
          type: "string",
          description:
            "The section identifier, e.g. 'hero_image' (homepage hero photo), 'hero_title', 'hero_description', 'hero', 'hours', 'description', 'faq'",
        },
        content: {
          type: "string",
          description: "The new content — plain text, markdown, or an image URL",
        },
      },
      required: ["page", "section", "content"],
    },
  },

  /* ───── Newsletter ───── */
  {
    name: "send_newsletter_draft",
    description:
      "Generate and preview a newsletter email draft. Does NOT send it — returns a preview the staff member can review.",
    input_schema: {
      type: "object" as const,
      properties: {
        subject: {
          type: "string",
          description: "Email subject line",
        },
        sections: {
          type: "array",
          description: "Ordered content sections of the newsletter",
          items: {
            type: "object",
            properties: {
              heading: { type: "string", description: "Section heading" },
              body: { type: "string", description: "Section body text" },
              image_url: {
                type: "string",
                description: "Optional section image",
              },
              link_url: {
                type: "string",
                description: "Optional CTA link",
              },
              link_text: {
                type: "string",
                description: "CTA button text",
              },
            },
            required: ["heading", "body"],
          },
        },
      },
      required: ["subject", "sections"],
    },
  },

  /* ───── Image Search & Generation ───── */
  {
    name: "search_images",
    description:
      "Search for relevant stock photos to use on the website. Returns a list of image URLs with descriptions. Use these URLs with update_page_content to set images on any page or event.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "A descriptive search query, e.g. 'children reading books library', 'community event outdoors', 'senior adults library'",
        },
        count: {
          type: "number",
          description: "Number of images to return (1-6). Defaults to 4.",
        },
        orientation: {
          type: "string",
          enum: ["landscape", "portrait", "square"],
          description: "Preferred image orientation. Defaults to landscape.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "generate_image",
    description:
      "Generate a custom AI image for use on the website — great for event banners, page headers, or promotional graphics. The image is automatically uploaded to storage and the URL is returned. Use the returned URL with update_page_content to place it on the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description:
            "Detailed description of the image to generate. Be specific about style, content, mood. Example: 'Warm, welcoming library interior with natural light, books on shelves, a cozy reading nook, photorealistic style'",
        },
        style: {
          type: "string",
          enum: ["photorealistic", "illustration", "watercolor", "flat-design"],
          description: "Visual style. Defaults to photorealistic.",
        },
        aspect_ratio: {
          type: "string",
          enum: ["16:9", "4:3", "1:1", "3:2"],
          description: "Aspect ratio of the generated image. Defaults to 16:9.",
        },
        purpose: {
          type: "string",
          description:
            "Where this image will be used, e.g. 'event banner for story time', 'hero image for kids page'. Helps optimize the prompt.",
        },
      },
      required: ["prompt"],
    },
  },

  /* ───── Page Reading ───── */
  {
    name: "read_page",
    description:
      "Read the current live content of any page on the website — hero text, images, descriptions, announcements, upcoming events, hours, etc. Use this whenever you need to see what's currently on a page before making changes, or when the user asks what's there.",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          description:
            "The page slug to read, e.g. 'home', 'kids', 'about', 'services', 'events'. Use 'home' for the homepage.",
        },
      },
      required: ["page"],
    },
  },

  /* ───── Analytics ───── */
  {
    name: "get_analytics",
    description:
      "Retrieve website and engagement analytics for a given time period.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: {
          type: "string",
          enum: ["today", "7d", "30d", "90d", "year"],
          description: "Time period for the analytics report",
        },
        metrics: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "page_views",
              "unique_visitors",
              "top_pages",
              "event_signups",
              "catalog_searches",
              "chat_interactions",
            ],
          },
          description: "Which metrics to include",
        },
      },
      required: ["period"],
    },
  },
];
