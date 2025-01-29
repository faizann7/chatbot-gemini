import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const messages = await kv.get(`chat:${userId}`);
    return NextResponse.json({ messages: messages ? JSON.parse(messages) : [] });
}
