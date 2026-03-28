/**
 * CMS Schema — single source of truth for every editable element.
 *
 * Each entry maps a (page, section) pair to its field type and UI metadata.
 * Used by: ColorPickerBar, InlineEditorOverlay, AI system prompt, validation.
 */

export type CMSFieldType = "text" | "richtext" | "color" | "gradient" | "image" | "css" | "url";

export interface CMSField {
  page: string;
  section: string;
  label: string;
  type: CMSFieldType;
  group: string;
  default?: string;
}

const cmsSchema: CMSField[] = [
  // ─── Global ───
  { page: "global", section: "header_bg_color",           label: "Header BG",             type: "color",    group: "Colors",    default: "#114d3e" },

  // ─── Home — Colors ───
  { page: "home",   section: "hero_bg_color",              label: "Hero BG",               type: "gradient", group: "Colors" },
  { page: "home",   section: "hero_accent_color",          label: "Accent",                type: "color",    group: "Colors" },
  { page: "home",   section: "stats_strip_bg",             label: "Stats Strip BG",        type: "gradient", group: "Colors" },
  { page: "home",   section: "staff_picks_bg",             label: "Staff Picks BG",        type: "gradient", group: "Colors" },

  // ─── Home — Hero ───
  { page: "home",   section: "hero_title",                 label: "Hero Title",            type: "text",     group: "Hero" },
  { page: "home",   section: "hero_subtitle",              label: "Hero Subtitle",         type: "text",     group: "Hero" },
  { page: "home",   section: "hero_description",           label: "Description",           type: "richtext", group: "Hero" },
  { page: "home",   section: "hero_image",                 label: "Hero Image",            type: "image",    group: "Hero" },
  { page: "home",   section: "search_placeholder",         label: "Search Placeholder",    type: "text",     group: "Hero",     default: "Search books, events, services..." },
  { page: "home",   section: "search_button_text",         label: "Search Button",         type: "text",     group: "Hero",     default: "Search" },

  // ─── Home — Section Headings ───
  { page: "home",   section: "events_label",               label: "Events Label",          type: "text",     group: "Headings", default: "WHAT'S HAPPENING" },
  { page: "home",   section: "events_heading",             label: "Events Heading",        type: "text",     group: "Headings", default: "Upcoming Events" },
  { page: "home",   section: "new_arrivals_label",         label: "New Arrivals Label",    type: "text",     group: "Headings", default: "Just Added" },
  { page: "home",   section: "new_arrivals_heading",       label: "New Arrivals Heading",  type: "text",     group: "Headings", default: "New Arrivals" },
  { page: "home",   section: "digital_label",              label: "Digital Label",         type: "text",     group: "Headings", default: "Read Anywhere" },
  { page: "home",   section: "digital_heading",            label: "Digital Heading",       type: "text",     group: "Headings", default: "Digital Resources" },
  { page: "home",   section: "staff_picks_label",          label: "Staff Picks Label",     type: "text",     group: "Headings", default: "Recommended" },
  { page: "home",   section: "staff_picks_heading",        label: "Staff Picks Heading",   type: "text",     group: "Headings", default: "Staff Picks" },

  // ─── Home — Quick Actions (4 cards below hero) ───
  { page: "home",   section: "quick_action_1_title",       label: "Action 1 Title",        type: "text",     group: "Quick Actions", default: "My Account" },
  { page: "home",   section: "quick_action_1_description", label: "Action 1 Desc",         type: "text",     group: "Quick Actions", default: "Checkouts, holds & fines" },
  { page: "home",   section: "quick_action_1_icon",        label: "Action 1 Icon",         type: "text",     group: "Quick Actions", default: "user" },
  { page: "home",   section: "quick_action_1_href",        label: "Action 1 Link",         type: "url",      group: "Quick Actions", default: "/account" },
  { page: "home",   section: "quick_action_2_title",       label: "Action 2 Title",        type: "text",     group: "Quick Actions", default: "Get a Card" },
  { page: "home",   section: "quick_action_2_description", label: "Action 2 Desc",         type: "text",     group: "Quick Actions", default: "Free — apply in 2 minutes" },
  { page: "home",   section: "quick_action_2_icon",        label: "Action 2 Icon",         type: "text",     group: "Quick Actions", default: "card" },
  { page: "home",   section: "quick_action_2_href",        label: "Action 2 Link",         type: "url",      group: "Quick Actions", default: "/get-card" },
  { page: "home",   section: "quick_action_3_title",       label: "Action 3 Title",        type: "text",     group: "Quick Actions", default: "Book a Room" },
  { page: "home",   section: "quick_action_3_description", label: "Action 3 Desc",         type: "text",     group: "Quick Actions", default: "Free meeting space" },
  { page: "home",   section: "quick_action_3_icon",        label: "Action 3 Icon",         type: "text",     group: "Quick Actions", default: "home" },
  { page: "home",   section: "quick_action_3_href",        label: "Action 3 Link",         type: "url",      group: "Quick Actions", default: "/services/rooms" },
  { page: "home",   section: "quick_action_4_title",       label: "Action 4 Title",        type: "text",     group: "Quick Actions", default: "Passports" },
  { page: "home",   section: "quick_action_4_description", label: "Action 4 Desc",         type: "text",     group: "Quick Actions", default: "Book an appointment" },
  { page: "home",   section: "quick_action_4_icon",        label: "Action 4 Icon",         type: "text",     group: "Quick Actions", default: "passport" },
  { page: "home",   section: "quick_action_4_href",        label: "Action 4 Link",         type: "url",      group: "Quick Actions", default: "/services/passport" },

  // ─── Home — Layout / CSS ───
  { page: "home",   section: "stats_card_position",        label: "Stats Card Pos",        type: "css",      group: "Layout" },
];

export default cmsSchema;

/** Helper: get all color/gradient fields */
export function getColorFields(): CMSField[] {
  return cmsSchema.filter((f) => f.type === "color" || f.type === "gradient");
}

/** Helper: look up a field by page + section */
export function getField(page: string, section: string): CMSField | undefined {
  return cmsSchema.find((f) => f.page === page && f.section === section);
}

/** Helper: get all fields for a page */
export function getFieldsForPage(page: string): CMSField[] {
  return cmsSchema.filter((f) => f.page === page);
}

/** Available icon names for quick actions — imported dynamically to avoid circular deps */
export const AVAILABLE_ICONS = [
  "user", "users", "card", "passport", "id-card", "home", "building", "map-pin",
  "book", "book-open", "airplane", "car", "globe", "calendar", "clock",
  "phone", "mail", "message-circle", "wifi", "printer", "computer",
  "music", "film", "headphones", "camera", "search", "star", "heart",
  "key", "gift", "thumbs-up", "coffee", "palette", "baby", "graduation", "puzzle",
];

/** Helper: generate a summary for the AI system prompt */
export function getSchemaForPrompt(): string {
  const groups: Record<string, CMSField[]> = {};
  for (const f of cmsSchema) {
    const key = `${f.page}/${f.group}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }

  const lines: string[] = ["Available CMS sections (page, section → type):"];
  for (const [key, fields] of Object.entries(groups)) {
    lines.push(`  ${key}:`);
    for (const f of fields) {
      const def = f.default ? ` (default: "${f.default}")` : "";
      lines.push(`    - section="${f.section}" → ${f.type}${def} — ${f.label}`);
    }
  }
  // Add available icon names
  lines.push("");
  lines.push(`  ICON NAMES for quick_action_N_icon: ${AVAILABLE_ICONS.join(", ")}`);

  return lines.join("\n");
}
