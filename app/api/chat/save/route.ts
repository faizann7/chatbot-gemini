import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: Request) {
    try {
        const { userId, chatId, messages, title } = await request.json();

        if (!userId || !chatId) {
            return NextResponse.json({ error: 'User ID and Chat ID are required' }, { status: 400 });
        }

        const chatData = {
            id: chatId,
            messages,
            title: title || messages[0]?.content?.slice(0, 30) || 'New Chat',
            updatedAt: new Date().toISOString()
        };

        // Store messages for this specific chat
        await kv.hset(`user:${userId}:chats`, {
            [chatId]: chatData
        });

        return NextResponse.json({ success: true, chat: chatData });
    } catch (error) {
        console.error('Error saving chat:', error);
        return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
    }
} 