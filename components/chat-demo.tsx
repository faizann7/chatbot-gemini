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
    Pencil,
    Check,
    X,
    ListCollapse,
    PanelRight,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: string;
}

const API_KEY = "AIzaSyBBDrORVGX97fg_OQasbB-I_WFt_huR88U";
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
                title: title || messages[0]?.content?.slice(0, 30) || "New Chat",
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
            throw new Error("Failed to load chats");
        }
        const data = await res.json();
        return data.chats || [];
    } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
        return [];
    }
};

/**
 * ChatTitle
 *
 * A header component that displays the chat title with inline editing.
 * It shows a pencil icon for editing and, when in edit mode, displays save (check)
 * and cancel (X) buttons.
 */
const ChatTitle = ({
    title,
    onRename,
    className,
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
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmit();
                            if (e.key === "Escape") {
                                setEditableTitle(title);
                                setIsEditing(false);
                            }
                        }}
                        className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                        onClick={handleSubmit}
                        className="text-blue-500 hover:text-blue-600 p-1"
                        aria-label="Save chat title"
                    >
                        <Check className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => {
                            setEditableTitle(title);
                            setIsEditing(false);
                        }}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label="Cancel edit"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{title}</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                        aria-label="Edit chat title"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export function ChatDemo() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Update chat when messages change
    useEffect(() => {
        if (messages.length > 0 && currentChatId) {
            const currentChat = chatHistory.find((c) => c.id === currentChatId);
            // Keep the existing title if it exists
            const title = currentChat?.title;

            if (title) {
                // If we have a title, just update messages
                setChatHistory((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? { ...chat, messages, updatedAt: new Date().toISOString() }
                            : chat
                    )
                );
                saveChats(currentChatId, messages, title);
            } else {
                // If no title, generate one from first message
                const newTitle =
                    messages[0].content.slice(0, 30) +
                    (messages[0].content.length > 30 ? "..." : "");
                setChatHistory((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? { ...chat, messages, title: newTitle, updatedAt: new Date().toISOString() }
                            : chat
                    )
                );
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
        setMessages((current) => [...current, message]);
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
            content: input,
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
                content: responseText,
            });

            setInput("");
        } catch (err: any) {
            setError(err);
            append({
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: err.message || "An error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = async () => {
        const newChatId = Date.now().toString();
        const newChat = {
            id: newChatId,
            title: "New Chat",
            messages: [],
            updatedAt: new Date().toISOString(),
        };

        setCurrentChatId(newChatId);
        setMessages([]);
        await saveChats(newChatId, [], "New Chat");
        setChatHistory((prev) => [newChat, ...prev]);
        toast.success("Started a new chat");
    };

    const handleChatSelect = async (chatId: string) => {
        const chat = chatHistory.find((c) => c.id === chatId);
        if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await fetch(`/api/chat/delete?userId=guest&chatId=${chatId}`, {
                method: "DELETE",
            });
            setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
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
            const chat = chatHistory.find((c) => c.id === chatId);
            if (!chat) return;

            const updatedChat = {
                ...chat,
                title: newTitle,
                updatedAt: new Date().toISOString(),
            };

            await saveChats(chatId, chat.messages, newTitle);

            setChatHistory((prev) =>
                prev.map((c) => (c.id === chatId ? updatedChat : c))
            );

            toast.success("Chat renamed");
        } catch (error) {
            console.error("Error renaming chat:", error);
            toast.error("Failed to rename chat");
        }
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleGenerateQuiz = async (messageId: string) => {
        setIsLoading(true);
        const messageToQuiz = messages.find(m => m.id === messageId);
        if (!messageToQuiz) return;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{
                            text: `Generate exactly 3 multiple choice questions based on this content: "${messageToQuiz.content}". 
                            Format your response as a valid JSON array ONLY, like this example:
                            [
                                {
                                    "question": "What is the capital of France?",
                                    "options": ["Paris", "London", "Berlin", "Madrid"],
                                    "correctAnswer": 0
                                },
                                {
                                    "question": "Which planet is closest to the Sun?",
                                    "options": ["Venus", "Mercury", "Mars", "Earth"],
                                    "correctAnswer": 1
                                }
                            ]
                            Do not include any other text or explanation, just the JSON array.`
                        }]
                    }]
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);

            let quizQuestions;
            try {
                // Try to parse the response text directly
                quizQuestions = JSON.parse(data.candidates[0].content.parts[0].text.trim());
            } catch (parseError) {
                // If direct parsing fails, try to extract JSON from the response
                const jsonMatch = data.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    quizQuestions = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Failed to parse quiz questions from response");
                }
            }

            // Validate the quiz questions structure
            if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
                throw new Error("Invalid quiz questions format");
            }

            setMessages(current => current.map(msg =>
                msg.id === messageId ? {
                    ...msg,
                    quiz: {
                        questions: quizQuestions,
                        currentQuestion: 0,
                        isComplete: false
                    }
                } : msg
            ));

        } catch (err: any) {
            console.error("Quiz generation error:", err);
            toast.error(err.message || "Failed to generate quiz");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuizAnswer = (messageId: string, answerIndex: number) => {
        setMessages(current => current.map(msg => {
            if (msg.id !== messageId || !msg.quiz) return msg;

            const currentQ = msg.quiz.questions[msg.quiz.currentQuestion];
            const isCorrect = currentQ.correctAnswer === answerIndex;

            // Update the current question with user's answer
            const updatedQuestions = [...msg.quiz.questions];
            updatedQuestions[msg.quiz.currentQuestion] = {
                ...currentQ,
                userAnswer: answerIndex
            };

            // Check if this was the last question
            const isLastQuestion = msg.quiz.currentQuestion === msg.quiz.questions.length - 1;

            if (isLastQuestion) {
                // Calculate final score
                const score = updatedQuestions.reduce((acc, q) =>
                    acc + (q.userAnswer === q.correctAnswer ? 1 : 0), 0);

                return {
                    ...msg,
                    quiz: {
                        ...msg.quiz,
                        questions: updatedQuestions,
                        isComplete: true,
                        score
                    }
                };
            }

            // Move to next question
            return {
                ...msg,
                quiz: {
                    ...msg.quiz,
                    questions: updatedQuestions,
                    currentQuestion: msg.quiz.currentQuestion + 1
                }
            };
        }));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar - Fixed */}
            <div
                className={cn(
                    "flex h-full flex-col bg-secondary border-r border-border transition-all duration-200",
                    isSidebarCollapsed ? "w-[72px]" : "w-[260px]"
                )}
            >
                {/* Top Bar with Collapse Button, New Chat, and Theme Toggle */}
                <div className="flex-none py-4 px-2 flex items-center gap-2 justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg hover:bg-accent"
                        onClick={toggleSidebar}
                    >
                        <PanelRight className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                        {!isSidebarCollapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg hover:bg-accent"
                                onClick={handleNewChat}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        )}
                        <ThemeToggle />
                    </div>
                </div>

                {/* Chat List - Scrollable */}
                <ScrollArea className="flex-1">
                    <div className="px-2 py-2 space-y-1">
                        {chatHistory.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatSelect(chat.id)}
                                className={cn(
                                    "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors relative cursor-pointer",
                                    "hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-hover-foreground))]",
                                    currentChatId === chat.id
                                        ? "bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-hover-foreground))]"
                                        : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {isSidebarCollapsed ? (
                                        <MessageSquare className="h-4 w-4" />
                                    ) : (
                                        <span className="truncate text-sm">{chat.title}</span>
                                    )}
                                </div>
                                {!isSidebarCollapsed && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-2 text-muted-foreground hover:text-foreground"
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
                                                className="text-destructive-foreground gap-2"
                                            >
                                                <Trash className="h-4 w-4" />
                                                Delete chat
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content - Fixed Layout */}
            <div className="flex flex-1 flex-col h-full">
                {/* Header - Fixed */}
                <div className="flex-none border-b border-border p-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        {currentChatId && (
                            <ChatTitle
                                title={chatHistory.find((c) => c.id === currentChatId)?.title || "New Chat"}
                                onRename={(newTitle) => handleRenameChat(currentChatId, newTitle)}
                                className="group"
                            />
                        )}
                    </div>
                </div>

                {/* Chat Container */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full max-w-3xl mx-auto w-full">
                        <Chat
                            messages={messages}
                            handleSubmit={handleChatSubmit}
                            input={input}
                            handleInputChange={(e) => setInput(e.target.value)}
                            isLoading={isLoading}
                            error={error}
                            onGenerateQuiz={handleGenerateQuiz}
                            onQuizAnswer={handleQuizAnswer}
                            suggestions={[
                                "Tell me a joke 😄",
                                "Explain quantum computing 🔬",
                                "Write a poem about nature 🌿",
                                "Help me debug my code 💻",
                            ]}
                            className="flex flex-col h-full"
                        />
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="flex-none text-center py-3 text-xs text-muted-foreground">
                    <a
                        href="https://gemini.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                        Powered by Gemini AI
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}
