import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const chatId = searchParams.get('chatId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (chatId) {
            // Load specific chat
            const chat = await kv.hget(`user:${userId}:chats`, chatId);
            if (!chat) {
                return NextResponse.json({ messages: [] });
            }
            return NextResponse.json(chat);
        } else {
            // Load all chats
            const chats = await kv.hgetall(`user:${userId}:chats`);
            if (!chats) {
                return NextResponse.json({ chats: [] });
            }

            const parsedChats = Object.entries(chats).map(([id, chat]) => ({
                ...chat,
                id
            }));

            // Sort by updatedAt
            parsedChats.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return NextResponse.json({ chats: parsedChats });
        }
    } catch (error) {
        console.error('Error loading chat:', error);
        return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
    }
} 