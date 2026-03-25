import { NextRequest, NextResponse } from "next/server";
import { getAllData, getPublishedData } from "@/lib/cms/dataStore";
import { getColorFields } from "@/lib/cms/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cms/colors?preview=true
 * Returns current color values for all color fields defined in the CMS schema.
 */
export async function GET(request: NextRequest) {
  try {
    const isPreview = request.nextUrl.searchParams.get("preview") === "true";
    const cms = isPreview ? await getAllData() : await getPublishedData();
    const colorFields = getColorFields();

    const colors: Record<string, { value: string | null; label: string; page: string; section: string; type: string; default?: string }> = {};

    for (const field of colorFields) {
      const pageData = cms.pageContent?.[field.page] || {};
      const value = pageData[field.section] || null;
      colors[`${field.page}:${field.section}`] = {
        value,
        label: field.label,
        page: field.page,
        section: field.section,
        type: field.type,
        default: field.default,
      };
    }

    return NextResponse.json({ colors });
  } catch (err) {
    console.error("Colors API error:", err);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}
