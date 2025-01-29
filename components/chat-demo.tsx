"use client";

import { useState, useEffect, useRef } from "react";
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
import {
    MoreVertical,
    Plus,
    Trash,
    MessageSquare,
    ExternalLink,
    Menu,
    Pencil
} from "lucide-react";
import { toast } from "sonner";

interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: string;
}

const API_KEY = "AIzaSyCC6XshnCnVn8PqGaveDZ1Ba8csAt7UvPY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const saveChats = async (chatId: string, messages: Message[], title?: string) => {
    try {
        await fetch("/api/chat/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: "guest",
                chatId,
                messages,
                title: title || messages[0]?.content?.slice(0, 30) || 'New Chat'
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

// Add this component for the editable title
const ChatTitle = ({
    title,
    onRename,
    className
}: {
    title: string;
    onRename: (newTitle: string) => void;
    className?: string;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTitle, setEditableTitle] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditableTitle(title);
    }, [title]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSubmit = () => {
        if (editableTitle.trim() !== "" && editableTitle !== title) {
            onRename(editableTitle.trim());
        } else {
            setEditableTitle(title);
        }
        setIsEditing(false);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                        if (e.key === 'Escape') {
                            setEditableTitle(title);
                            setIsEditing(false);
                        }
                    }}
                    className="bg-transparent border-none outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 rounded px-2 py-1 w-full"
                />
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
                >
                    <span className="font-medium">{title}</span>
                    <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                </button>
            )}
        </div>
    );
};

export function ChatDemo() {
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Update chat when messages change
    useEffect(() => {
        if (messages.length > 0 && currentChatId) {
            const currentChat = chatHistory.find(c => c.id === currentChatId);
            // Keep the existing title if it exists
            const title = currentChat?.title;

            if (title) {
                // If we have a title, just update messages
                setChatHistory(prev => prev.map(chat =>
                    chat.id === currentChatId
                        ? { ...chat, messages, updatedAt: new Date().toISOString() }
                        : chat
                ));
                saveChats(currentChatId, messages, title);
            } else {
                // If no title, generate one from first message
                const newTitle = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
                setChatHistory(prev => prev.map(chat =>
                    chat.id === currentChatId
                        ? { ...chat, messages, title: newTitle, updatedAt: new Date().toISOString() }
                        : chat
                ));
                saveChats(currentChatId, messages, newTitle);
            }
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
        const newChat = {
            id: newChatId,
            title: 'New Chat',
            messages: [],
            updatedAt: new Date().toISOString()
        };

        setCurrentChatId(newChatId);
        setMessages([]);
        await saveChats(newChatId, [], 'New Chat');
        setChatHistory(prev => [newChat, ...prev]);
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

    const handleRenameChat = async (chatId: string, newTitle: string) => {
        try {
            const chat = chatHistory.find(c => c.id === chatId);
            if (!chat) return;

            const updatedChat = {
                ...chat,
                title: newTitle,
                updatedAt: new Date().toISOString()
            };

            await saveChats(chatId, chat.messages, newTitle);

            setChatHistory(prev => prev.map(c =>
                c.id === chatId ? updatedChat : c
            ));

            toast.success("Chat renamed");
        } catch (error) {
            console.error("Error renaming chat:", error);
            toast.error("Failed to rename chat");
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            {/* Sidebar */}
            <div className="flex flex-col w-[320px] bg-[#fafafa] border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                {/* New Chat Button */}
                <div className="p-3">
                    <Button
                        className="w-full justify-start gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                        onClick={handleNewChat}
                    >
                        <Plus className="h-4 w-4" />
                        New chat
                    </Button>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1 px-3 py-2">
                    <div className="space-y-1">
                        {chatHistory.map((chat) => (
                            <div
                                key={chat.id}
                                className={cn(
                                    "group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors relative",
                                    chat.id === currentChatId
                                        ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                )}
                                onClick={() => handleChatSelect(chat.id)}
                            >
                                <div className="flex items-center gap-2 truncate pr-8">
                                    <MessageSquare className="h-4 w-4 shrink-0" />
                                    <span className="truncate text-sm">{chat.title}</span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newTitle = prompt("Enter new name for chat:", chat.title);
                                                if (newTitle && newTitle.trim() !== "") {
                                                    handleRenameChat(chat.id, newTitle.trim());
                                                }
                                            }}
                                            className="gap-2"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Rename chat
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChat(chat.id);
                                            }}
                                            className="text-red-600 dark:text-red-400 gap-2"
                                        >
                                            <Trash className="h-4 w-4" />
                                            Delete chat
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 md:hidden"
                >
                    <Menu className="h-6 w-6" />
                </Button>

                {/* Chat Header */}
                <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        {currentChatId && (
                            <ChatTitle
                                title={chatHistory.find(c => c.id === currentChatId)?.title || 'New Chat'}
                                onRename={(newTitle) => handleRenameChat(currentChatId, newTitle)}
                                className="group"
                            />
                        )}
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
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
                        className="flex-1 flex flex-col"
                        messagesClassName="flex-1 px-4 py-3 space-y-6 overflow-y-auto"
                        inputClassName="px-4 py-3 border-t dark:border-gray-800 bg-white dark:bg-gray-900"
                    />

                    {/* Footer */}
                    <div className="text-center py-3 text-xs text-gray-500">
                        <a
                            href="https://gemini.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Powered by Gemini AI
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
