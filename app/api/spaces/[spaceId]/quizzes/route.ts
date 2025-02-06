import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { Space, QuizHistory } from "@/types/space"

// POST /api/spaces/[spaceId]/quizzes - Add a quiz to a space
export async function POST(
    request: Request,
    { params }: { params: { spaceId: string } }
) {
    try {
        const quiz = await request.json()
        const spaces = await kv.get<Space[]>("spaces") || []

        const updatedSpaces = spaces.map(space =>
            space.id === params.spaceId
                ? {
                    ...space,
                    quizzes: [...space.quizzes, quiz],
                    updatedAt: new Date().toISOString()
                }
                : space
        )

        await kv.set("spaces", updatedSpaces)
        return NextResponse.json(quiz)
    } catch (error) {
        console.error("Failed to save quiz:", error)
        return NextResponse.json(
            { error: "Failed to save quiz" },
            { status: 500 }
        )
    }
} 