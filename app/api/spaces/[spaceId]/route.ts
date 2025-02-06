import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { Space } from "@/types/space"

// DELETE /api/spaces/[spaceId] - Delete a space
export async function DELETE(
    request: Request,
    { params }: { params: { spaceId: string } }
) {
    try {
        const spaces = await kv.get<Space[]>("spaces") || []
        const updatedSpaces = spaces.filter(space => space.id !== params.spaceId)
        await kv.set("spaces", updatedSpaces)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete space:", error)
        return NextResponse.json(
            { error: "Failed to delete space" },
            { status: 500 }
        )
    }
}

// PATCH /api/spaces/[spaceId] - Update a space
export async function PATCH(
    request: Request,
    { params }: { params: { spaceId: string } }
) {
    try {
        const update = await request.json()
        const spaces = await kv.get<Space[]>("spaces") || []

        const updatedSpaces = spaces.map(space =>
            space.id === params.spaceId
                ? { ...space, ...update, updatedAt: new Date().toISOString() }
                : space
        )

        await kv.set("spaces", updatedSpaces)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update space:", error)
        return NextResponse.json(
            { error: "Failed to update space" },
            { status: 500 }
        )
    }
} 