import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { Space } from "@/types/space"

export async function POST(request: Request) {
    try {
        const { spaces } = await request.json()
        await kv.set("spaces", spaces)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to sync spaces:", error)
        return NextResponse.json(
            { error: "Failed to sync spaces" },
            { status: 500 }
        )
    }
} 