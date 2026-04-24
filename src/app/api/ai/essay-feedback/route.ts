import { NextResponse } from "next/server";

import { aiService } from "@/server/ai/service";

export async function POST(request: Request) {
  let payload: { draft?: string; prompt?: string } | undefined;

  try {
    payload = (await request.json()) as { draft?: string; prompt?: string };
  } catch {
    payload = undefined;
  }

  const feedback = await aiService.generateEssayFeedback(payload);

  return NextResponse.json({
    data: feedback,
  });
}
