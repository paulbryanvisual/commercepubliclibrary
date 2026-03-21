/**
 * CMS data store backed by Supabase.
 * Supports draft/publish workflow: content is created as 'draft' and
 * only shown on the live site when status is 'published'.
 * The admin preview shows both drafts and published content.
 */

import { supabase } from "@/lib/supabase";

/* ── Types ── */

export type ContentStatus = "draft" | "published";

export interface CMSEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  description: string;
  audience: string;
  location: string;
  recurring: string;
  imageUrl?: string;
  cancelled: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CMSAnnouncement {
  id: string;
  title: string;
  body: string;
  type: "news" | "alert" | "closure" | "celebration";
  startsAt: string;
  expiresAt?: string;
  pinned: boolean;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CMSStaffPick {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  staffName: string;
  review: string;
  category: string;
  imageUrl?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CMSClosure {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  specialHours?: string;
  message?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CMSHoursOverride {
  id: string;
  day: string;
  open: string;
  close: string;
  closed: boolean;
  effectiveDate?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CMSPageContent {
  id: string;
  page: string;
  section: string;
  content: string;
  status: ContentStatus;
  updatedAt: string;
}

export interface CMSData {
  events: CMSEvent[];
  announcements: CMSAnnouncement[];
  staffPicks: CMSStaffPick[];
  closures: CMSClosure[];
  hoursOverrides: CMSHoursOverride[];
  pageContent: Record<string, Record<string, string>>;
}

/* ── Row mappers (snake_case DB → camelCase app) ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any): CMSEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    description: row.description,
    audience: row.audience,
    location: row.location,
    recurring: row.recurring || "none",
    imageUrl: row.image,
    cancelled: false,
    status: row.status || "published",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnouncement(row: any): CMSAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type || "news",
    startsAt: row.created_at,
    expiresAt: undefined,
    pinned: false,
    status: row.status || "published",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStaffPick(row: any): CMSStaffPick {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    staffName: row.staff_name,
    review: row.blurb,
    category: row.genre,
    imageUrl: row.cover_url,
    status: row.status || "published",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClosure(row: any): CMSClosure {
  return {
    id: row.id,
    title: row.reason || "Closure",
    startDate: row.date,
    endDate: row.date,
    status: row.status || "published",
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHoursOverride(row: any): CMSHoursOverride {
  return {
    id: row.id,
    day: row.day_of_week,
    open: row.open_time || "09:00",
    close: row.close_time || "18:00",
    closed: row.closed || false,
    status: row.status || "published",
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
  };
}

/* ── Read CMS data ── */

/**
 * Get published content only (for the live public site).
 */
export async function getPublishedData(): Promise<CMSData> {
  return fetchData("published");
}

/**
 * Get all content including drafts (for admin preview).
 */
export async function getAllData(): Promise<CMSData> {
  return fetchData("all");
}

/**
 * Legacy alias — returns published data only.
 */
export async function getData(): Promise<CMSData> {
  return getPublishedData();
}

async function fetchData(mode: "published" | "all"): Promise<CMSData> {
  // Build queries with optional status filter
  let eventsQuery = supabase.from("events").select("*").order("date", { ascending: true });
  let announcementsQuery = supabase.from("announcements").select("*");
  let picksQuery = supabase.from("staff_picks").select("*");
  let closuresQuery = supabase.from("closures").select("*").order("date", { ascending: true });
  let hoursQuery = supabase.from("hours_overrides").select("*");
  let pageQuery = supabase.from("page_content").select("*");

  if (mode === "published") {
    // Filter for published only — also include items without status column (backwards compat)
    eventsQuery = eventsQuery.eq("status", "published");
    announcementsQuery = announcementsQuery.eq("status", "published").eq("active", true);
    picksQuery = picksQuery.eq("status", "published").eq("active", true);
    closuresQuery = closuresQuery.eq("status", "published");
    hoursQuery = hoursQuery.eq("status", "published");
    pageQuery = pageQuery.eq("status", "published");
  } else {
    // For preview: show all (draft + published)
    announcementsQuery = announcementsQuery.eq("active", true);
    picksQuery = picksQuery.eq("active", true);
  }

  const [eventsRes, announcementsRes, picksRes, closuresRes, hoursRes, pageRes] =
    await Promise.all([
      eventsQuery,
      announcementsQuery,
      picksQuery,
      closuresQuery,
      hoursQuery,
      pageQuery,
    ]);

  const pageContent: Record<string, Record<string, string>> = {};
  for (const row of pageRes.data || []) {
    if (!pageContent[row.page]) pageContent[row.page] = {};
    pageContent[row.page][row.section] = row.content;
  }

  return {
    events: (eventsRes.data || []).map(mapEvent),
    announcements: (announcementsRes.data || []).map(mapAnnouncement),
    staffPicks: (picksRes.data || []).map(mapStaffPick),
    closures: (closuresRes.data || []).map(mapClosure),
    hoursOverrides: (hoursRes.data || []).map(mapHoursOverride),
    pageContent,
  };
}

/* ── Events ── */

export async function addEvent(input: {
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  description: string;
  audience: string;
  location?: string;
  recurring?: string;
  image_url?: string;
}): Promise<CMSEvent> {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      slug,
      description: input.description,
      date: input.date,
      start_time: input.start_time,
      end_time: input.end_time,
      location: input.location || "Main Library",
      audience: input.audience,
      recurring: input.recurring,
      image: input.image_url,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapEvent(data);
}

export async function updateEvent(input: {
  event_id: string;
  title?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  audience?: string;
  location?: string;
  cancelled?: boolean;
}): Promise<CMSEvent> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.date !== undefined) updates.date = input.date;
  if (input.start_time !== undefined) updates.start_time = input.start_time;
  if (input.end_time !== undefined) updates.end_time = input.end_time;
  if (input.description !== undefined) updates.description = input.description;
  if (input.audience !== undefined) updates.audience = input.audience;
  if (input.location !== undefined) updates.location = input.location;

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", input.event_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapEvent(data);
}

export async function deleteEvent(input: {
  event_id: string;
  confirm: boolean;
}): Promise<{ deleted: boolean; id: string }> {
  if (!input.confirm) throw new Error("Deletion not confirmed");

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", input.event_id);

  if (error) throw new Error(error.message);
  return { deleted: true, id: input.event_id };
}

/* ── Announcements ── */

export async function addAnnouncement(input: {
  title: string;
  body: string;
  type: "news" | "alert" | "closure" | "celebration";
  starts_at?: string;
  expires_at?: string;
  pinned?: boolean;
}): Promise<CMSAnnouncement> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      body: input.body,
      type: input.type === "news" ? "info" : input.type,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAnnouncement(data);
}

/* ── Staff Picks ── */

export async function addStaffPick(input: {
  title: string;
  author: string;
  isbn?: string;
  staff_name: string;
  review: string;
  category: string;
  image_url?: string;
}): Promise<CMSStaffPick> {
  const { data, error } = await supabase
    .from("staff_picks")
    .insert({
      title: input.title,
      author: input.author,
      isbn: input.isbn,
      staff_name: input.staff_name,
      blurb: input.review,
      genre: input.category,
      cover_url: input.image_url,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapStaffPick(data);
}

/* ── Closures ── */

export async function addClosure(input: {
  title: string;
  start_date: string;
  end_date: string;
  special_hours?: string;
  message?: string;
}): Promise<CMSClosure> {
  const { data, error } = await supabase
    .from("closures")
    .insert({
      date: input.start_date,
      reason: input.title + (input.message ? ` — ${input.message}` : ""),
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapClosure(data);
}

/* ── Hours overrides ── */

export async function updateHours(input: {
  hours: Array<{
    day: string;
    open?: string;
    close?: string;
    closed?: boolean;
  }>;
  effective_date?: string;
}): Promise<CMSHoursOverride[]> {
  const results: CMSHoursOverride[] = [];

  for (const h of input.hours) {
    const { data, error } = await supabase
      .from("hours_overrides")
      .upsert(
        {
          day_of_week: h.day,
          open_time: h.open || "09:00",
          close_time: h.close || "18:00",
          closed: h.closed || false,
          status: "draft",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "day_of_week" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    results.push(mapHoursOverride(data));
  }

  return results;
}

/* ── Page Content ── */

export async function updatePageContent(input: {
  page: string;
  section: string;
  content: string;
}): Promise<CMSPageContent> {
  const { data, error } = await supabase
    .from("page_content")
    .upsert(
      {
        page: input.page,
        section: input.section,
        content: input.content,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page,section" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    page: data.page,
    section: data.section,
    content: data.content,
    status: data.status || "draft",
    updatedAt: data.updated_at,
  };
}

/* ── Publish / Discard ── */

/** Publish a single draft item (flip status from 'draft' to 'published'). */
export async function publishItem(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Publish all drafts across all tables. */
export async function publishAllDrafts(): Promise<{ count: number }> {
  const tables = ["events", "announcements", "staff_picks", "closures", "hours_overrides", "page_content"];
  let count = 0;

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("status", "draft")
      .select("id");

    count += (data || []).length;
  }

  return { count };
}

/** Discard (delete) a draft item. */
export async function discardDraft(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("status", "draft");

  if (error) throw new Error(error.message);
}

/** Get count of pending drafts across all tables. */
export async function getDraftCount(): Promise<number> {
  const tables = ["events", "announcements", "staff_picks", "closures", "hours_overrides", "page_content"];
  let count = 0;

  for (const table of tables) {
    const { count: c } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("status", "draft");

    count += c || 0;
  }

  return count;
}
