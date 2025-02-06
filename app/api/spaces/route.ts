import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { Space } from "@/types/space"

// GET /api/spaces - Get all spaces
export async function GET() {
    try {
        const spaces = await kv.get<Space[]>("spaces") || []
        return NextResponse.json(spaces)
    } catch (error) {
        console.error("Failed to fetch spaces:", error)
        return NextResponse.json(
            { error: "Failed to fetch spaces" },
            { status: 500 }
        )
    }
}

// POST /api/spaces - Create a new space
export async function POST(request: Request) {
    try {
        const newSpace = await request.json()
        const spaces = await kv.get<Space[]>("spaces") || []

        // Add new space to the list
        const updatedSpaces = [...spaces, newSpace]
        await kv.set("spaces", updatedSpaces)

        return NextResponse.json(newSpace)
    } catch (error) {
        console.error("Failed to create space:", error)
        return NextResponse.json(
            { error: "Failed to create space" },
            { status: 500 }
        )
    }
}

