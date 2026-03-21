import { NextRequest, NextResponse } from "next/server";
import { getPublishedData, getAllData } from "@/lib/cms/dataStore";

export const runtime = "nodejs";

const VALID_TYPES = [
  "events",
  "announcements",
  "staffPicks",
  "closures",
  "hoursOverrides",
  "pageContent",
] as const;

type CMSType = (typeof VALID_TYPES)[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CMSType | null;
    const preview = searchParams.get("preview") === "true";

    // Preview mode shows drafts + published; normal mode shows published only
    const data = preview ? await getAllData() : await getPublishedData();

    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json(
          {
            error: `Invalid type. Valid types: ${VALID_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ [type]: data[type] });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
