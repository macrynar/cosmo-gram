import { NextRequest, NextResponse } from "next/server";
import { calculateChart } from "@/lib/chart-engine";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json() as {
      date: string; time: string; lat: number; lng: number; place: string; timeUnknown?: boolean;
    };
    if (!input.date || (!input.time && !input.timeUnknown) || input.lat == null || input.lng == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = calculateChart(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Chart calculation error:", err);
    return NextResponse.json({ error: "Chart calculation failed" }, { status: 500 });
  }
}
