"use client";

import { useState, useEffect } from "react";
import Chat from "@/components/ui/chat";
import { cn } from "@/lib/utils";
import type { Message } from "@/components/ui/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: string;
}

const API_KEY = "AIzaSyCC6XshnCnVn8PqGaveDZ1Ba8csAt7UvPY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const saveChats = async (chatId: string, messages: Message[]) => {
    try {
        await fetch("/api/chat/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: "guest",
                chatId,
                messages,
                title: messages[0]?.content?.slice(0, 30) || 'New Chat'
            }),
        });
    } catch (error) {
        console.error("Error saving chat history:", error);
    }
};

const loadChats = async (): Promise<ChatHistory[]> => {
    try {
        const res = await fetch(`/api/chat/load?userId=guest`);
        if (!res.ok) {
            throw new Error('Failed to load chats');
        }
        const data = await res.json();
        return data.chats || [];
    } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
        return [];
    }
};

export function ChatDemo() {
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Update chat title when first message is added
    useEffect(() => {
        if (messages.length > 0 && currentChatId) {
            const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
            setChatHistory(prev => prev.map(chat =>
                chat.id === currentChatId
                    ? { ...chat, title, messages, updatedAt: new Date().toISOString() }
                    : chat
            ));
            saveChats(currentChatId, messages);
        }
    }, [messages, currentChatId]);

    // Create new chat if none exists on mount
    useEffect(() => {
        const loadAllChats = async () => {
            const chats = await loadChats();
            setChatHistory(chats);
            if (chats.length > 0) {
                const mostRecent = chats[0]; // Chats are already sorted by updatedAt
                setCurrentChatId(mostRecent.id);
                setMessages(mostRecent.messages);
            } else {
                handleNewChat();
            }
        };
        loadAllChats();
    }, []);

    const append = (message: Message) => {
        setMessages(current => [...current, message]);
    };

    const handleChatSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim()) return;

        // Create new chat if none exists
        if (!currentChatId) {
            await handleNewChat();
        }

        setIsLoading(true);
        setError(null);

        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input
        };
        append(userMessage);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: input }] }],
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);

            const responseText = data.candidates[0].content.parts[0].text;
            append({
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: responseText
            });

            setInput("");
        } catch (err: any) {
            setError(err);
            append({
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: err.message || "An error occurred"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = async () => {
        const newChatId = Date.now().toString();
        setCurrentChatId(newChatId);
        setMessages([]);
        await saveChats(newChatId, []);
        setChatHistory(prev => [{
            id: newChatId,
            title: 'New Chat',
            messages: [],
            updatedAt: new Date().toISOString()
        }, ...prev]);
        toast.success("Started a new chat");
    };

    const handleChatSelect = async (chatId: string) => {
        const chat = chatHistory.find(c => c.id === chatId);
        if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await fetch(`/api/chat/delete?userId=guest&chatId=${chatId}`, {
                method: 'DELETE'
            });
            setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
            if (currentChatId === chatId) {
                handleNewChat();
            }
            toast.success("Chat deleted");
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Failed to delete chat");
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="p-4">
                    <Button
                        className="w-full justify-start gap-2"
                        onClick={handleNewChat}
                    >
                        <Plus className="h-4 w-4" />
                        New Chat
                    </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-5rem)]">
                    <div className="space-y-2 p-4">
                        {chatHistory.map((chat) => (
                            <div
                                key={chat.id}
                                className={cn(
                                    "group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer",
                                    chat.id === currentChatId
                                        ? "bg-gray-200 dark:bg-gray-800"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                                onClick={() => handleChatSelect(chat.id)}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="truncate">{chat.title}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChat(chat.id);
                                    }}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header with Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            AI Assistant
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Ask me anything and I'll help you find the answer
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNewChat}
                            className="h-8 w-8"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">New Chat</span>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={handleNewChat}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Chat
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleDeleteChat}
                                    className="text-red-600 dark:text-red-400 gap-2"
                                >
                                    <Trash className="h-4 w-4" />
                                    Delete Chat History
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <Chat
                        messages={messages}
                        handleSubmit={handleChatSubmit}
                        input={input}
                        handleInputChange={(e) => setInput(e.target.value)}
                        isLoading={isLoading}
                        error={error}
                        suggestions={[
                            "Tell me a joke 😄",
                            "Explain quantum computing 🔬",
                            "Write a poem about nature 🌿",
                            "Help me debug my code 💻"
                        ]}
                        className={cn(
                            "min-h-[600px]",
                            "grid grid-rows-[1fr,auto]"
                        )}
                        messagesClassName="px-6 py-4 overflow-y-auto space-y-4"
                        inputClassName="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden scrollbar-hidden"
                    />
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                    Powered by Gemini AI • Built with Next.js
                </div>
            </div>
        </div>
    );
}
