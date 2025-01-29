import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId, messages } = await req.json();
        await kv.set(`chat:${userId}`, JSON.stringify(messages));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
    }
}
