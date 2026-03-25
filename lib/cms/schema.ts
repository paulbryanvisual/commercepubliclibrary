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
  { page: "global", section: "header_bg_color",     label: "Header BG",      type: "color",    group: "Colors",  default: "#114d3e" },

  // ─── Home — Colors ───
  { page: "home",   section: "hero_bg_color",        label: "Hero BG",        type: "gradient", group: "Colors" },
  { page: "home",   section: "hero_accent_color",    label: "Accent",         type: "color",    group: "Colors" },

  // ─── Home — Hero ───
  { page: "home",   section: "hero_title",           label: "Hero Title",     type: "text",     group: "Hero" },
  { page: "home",   section: "hero_subtitle",        label: "Hero Subtitle",  type: "text",     group: "Hero" },
  { page: "home",   section: "hero_description",     label: "Description",    type: "richtext", group: "Hero" },
  { page: "home",   section: "hero_image",           label: "Hero Image",     type: "image",    group: "Hero" },

  // ─── Home — Layout ───
  { page: "home",   section: "stats_card_position",  label: "Stats Card Pos", type: "css",      group: "Layout" },
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
