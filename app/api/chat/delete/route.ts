import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const chatId = searchParams.get('chatId');

        if (!userId || !chatId) {
            return NextResponse.json({ error: 'User ID and Chat ID are required' }, { status: 400 });
        }

        await kv.hdel(`user:${userId}:chats`, chatId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
} 