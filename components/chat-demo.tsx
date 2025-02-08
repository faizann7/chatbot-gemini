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
    Folder,
    Brain,
    BookOpen,
    LayoutDashboard,
    Copy,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { SpaceActionsDropdown } from "@/components/ui/space-actions-dropdown";
import { TabButton } from "@/components/ui/tab-button";
import { QuizHistoryTab } from "@/components/ui/quiz-history-tab";
import type { Space, ChatHistory, QuizHistory } from "@/types/space";
import ChatMessage from "@/components/ui/chat-message";

interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: string;
}

interface Space {
    id: string;
    name: string;
    description?: string;
    chats: ChatHistory[];
    quizzes: QuizHistory[];
    createdAt: string;
    updatedAt: string;
}

interface QuizHistory {
    id: string;
    questions: QuizQuestion[];
    score?: number;
    takenAt: string;
    type: 'message' | 'session';
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

// Helper function to prepare messages for the API
const prepareMessagesForAPI = (messages: Message[]) => {
    // Get last 10 messages to stay within context limits
    const recentMessages = messages.slice(-10);

    return recentMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
};

// Update the determineQuizLength function to be more granular
const determineQuizLength = (content: string, type: 'message' | 'session', messages: Message[]) => {
    if (type === 'message') {
        // For message quizzes, base it on content length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 100) return 2;
        if (wordCount < 200) return 3;
        if (wordCount < 300) return 4;
        return 5;
    } else {
        // For session quizzes, base it on conversation length and complexity
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        if (assistantMessages.length <= 5) return 4;
        if (assistantMessages.length <= 10) return 6;
        return 8;
    }
};

const getPreviousQuizMistakes = (messages: Message[]) => {
    // Collect concepts that the user got wrong in previous quizzes
    const mistakes = messages
        .filter(m => m.quiz?.isComplete)
        .flatMap(m => m.quiz!.questions)
        .filter(q => q.userAnswer !== undefined && q.userAnswer !== q.correctAnswer)
        .map(q => ({
            question: q.question,
            correctAnswer: q.options[q.correctAnswer],
            explanation: q.explanation
        }));

    return mistakes;
};

// Add helper function to analyze quiz history
const analyzeQuizHistory = (messages: Message[]) => {
    const quizHistory = messages
        .filter(m => m.quiz?.isComplete)
        .map(m => ({
            questions: m.quiz!.questions,
            score: m.quiz!.score || 0,
            totalQuestions: m.quiz!.questions.length
        }));

    const averageScore = quizHistory.length > 0
        ? quizHistory.reduce((acc, quiz) => acc + (quiz.score / quiz.totalQuestions), 0) / quizHistory.length
        : null;

    return {
        quizzesTaken: quizHistory.length,
        averageScore,
        shouldIncreaseDifficulty: averageScore !== null && averageScore > 0.8 // Increase difficulty if avg score > 80%
    };
};

// Add helper function to check if new content warrants a new quiz
const shouldEnableNewSessionQuiz = (messages: Message[]) => {
    const lastQuizIndex = messages.findLastIndex(m => m.quiz?.type === 'session');
    if (lastQuizIndex === -1) return true;

    // Get messages after the last quiz
    const newMessages = messages.slice(lastQuizIndex + 1);
    const newAssistantMessages = newMessages.filter(m => m.role === 'assistant');

    // Check if there are enough new messages
    if (newAssistantMessages.length < 3) return false;

    // Check if new messages contain significant content
    const significantMessages = newAssistantMessages.filter(m =>
        m.content.split(/\s+/).length > 50  // Messages with more than 50 words
    );

    return significantMessages.length >= 2;  // At least 2 significant messages
};

export function ChatDemo() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [showQuizUpdateNotification, setShowQuizUpdateNotification] = useState(false);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'quizzes' | 'resources'>('chat');

    // Add new state for sorting spaces
    const sortedSpaces = spaces.sort((a, b) => {
        const aLastUpdate = new Date(a.updatedAt).getTime();
        const bLastUpdate = new Date(b.updatedAt).getTime();
        return bLastUpdate - aLastUpdate;
    });

    // Move fetchSpaces inside component
    const fetchSpaces = async () => {
        try {
            const response = await fetch('/api/spaces');
            if (!response.ok) throw new Error('Failed to fetch spaces');
            const spaces = await response.json();
            setSpaces(spaces);

            // If there was a current space, try to restore it
            if (currentSpaceId) {
                const currentSpace = spaces.find(s => s.id === currentSpaceId);
                if (currentSpace) {
                    // Restore messages from the current space's active chat
                    const activeChat = currentSpace.chats[0]; // Or whichever chat was active
                    if (activeChat) {
                        setMessages(activeChat.messages);
                    }
                }
            }
        } catch (err) {
            toast.error("Failed to load spaces");
            console.error(err);
        }
    };

    // Load spaces on component mount
    useEffect(() => {
        fetchSpaces();
    }, []);

    // Update KV when spaces change
    useEffect(() => {
        if (spaces.length > 0) {
            fetch('/api/spaces/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spaces })
            }).catch(err => {
                console.error('Failed to sync spaces:', err);
            });
        }
    }, [spaces]);

    // Update messages in space when they change
    useEffect(() => {
        if (currentSpaceId && messages.length > 0) {
            setSpaces(current => current.map(space =>
                space.id === currentSpaceId
                    ? {
                        ...space,
                        chats: [{
                            id: space.chats[0]?.id || `chat-${Date.now()}`,
                            title: space.chats[0]?.title || "Main Chat",
                            messages,
                            updatedAt: new Date().toISOString()
                        }, ...space.chats.slice(1)],
                        updatedAt: new Date().toISOString()
                    }
                    : space
            ));
        }
    }, [messages, currentSpaceId]);

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

    // Add effect to check for new quiz availability
    useEffect(() => {
        if (shouldEnableNewSessionQuiz(messages) && messages.some(m => m.quiz?.type === 'session')) {
            setShowQuizUpdateNotification(true);
        }
    }, [messages]);

    // Clear messages when no space is selected
    useEffect(() => {
        if (!currentSpaceId) {
            setMessages([]);
        }
    }, [currentSpaceId]);

    const append = (message: Message) => {
        setMessages((current) => [...current, message]);
    };

    // Update handleSpaceSelect to properly load space messages
    const handleSpaceSelect = (spaceId: string) => {
        const space = spaces.find(s => s.id === spaceId);
        if (space) {
            setCurrentSpaceId(spaceId);
            // Load messages from the selected space's active chat
            const activeChat = space.chats[0];
            setMessages(activeChat?.messages || []);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || !currentSpaceId) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        // Add message to current chat
        setMessages(current => [...current, userMessage]);
        setInput("");

        // Update space with new message
        setSpaces(current => current.map(space =>
            space.id === currentSpaceId
                ? {
                    ...space,
                    chats: [{
                        id: space.chats[0]?.id || `chat-${Date.now()}`,
                        title: space.chats[0]?.title || "Main Chat",
                        messages: [...(space.chats[0]?.messages || []), userMessage],
                        updatedAt: new Date().toISOString()
                    }, ...space.chats.slice(1)],
                    updatedAt: new Date().toISOString()
                }
                : space
        ));

        try {
            // Get conversation history including the new message
            const conversationHistory = prepareMessagesForAPI([
                ...messages,
                userMessage
            ]);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: conversationHistory,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);

            const responseText = data.candidates[0].content.parts[0].text;

            // Add AI response
            setMessages(current => [
                ...current,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: responseText,
                }
            ]);

        } catch (err: any) {
            setError(err);
            toast.error(err.message || "Failed to send message");
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

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Update handleGenerateQuiz for message-level quizzes
    const handleGenerateQuiz = async (messageId: string, content: string) => {
        setIsLoading(true);
        const messageToQuiz = messages.find(m => m.id === messageId);
        if (!messageToQuiz) return;

        try {
            const messageIndex = messages.findIndex(m => m.id === messageId);
            const contextMessages = messages.slice(0, messageIndex + 1);
            const quizLength = determineQuizLength(content, 'message', contextMessages);
            const previousMistakes = getPreviousQuizMistakes(messages);
            const quizHistory = analyzeQuizHistory(messages);

            const conversationHistory = prepareMessagesForAPI(contextMessages);
            conversationHistory.push({
                role: "user",
                parts: [{
                    text: `Generate exactly ${quizLength} multiple choice questions based on your previous explanation.
                    ${previousMistakes.length > 0 ? `
                    Consider these previously challenging concepts:
                    ${previousMistakes.map(m => `- ${m.question}`).join('\n')}
                    Try to include at least one question that tests understanding of these concepts.
                    ` : ''}
                    ${quizHistory.shouldIncreaseDifficulty ? 'Make the questions more challenging than usual.' : ''}
                    Format your response as a valid JSON array ONLY:
                    [
                        {
                            "question": "question text here",
                            "options": ["option 1", "option 2", "option 3", "option 4"],
                            "correctAnswer": 0,
                            "explanation": "Brief explanation of why this is the correct answer",
                            "difficulty": "beginner|intermediate|advanced",
                            "topic": "specific topic or concept being tested"
                        }
                    ]
                    Make questions progressively more challenging. Include clear explanations.
                    Do not include any other text.`
                }]
            });

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: conversationHistory }),
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

    // Update handleQuizAnswer to not show completed quizzes in chat
    const handleQuizAnswer = async (messageId: string, answerIndex: number) => {
        setMessages(current => current.map(msg => {
            if (msg.id !== messageId || !msg.quiz) return msg;

            const currentQ = msg.quiz.questions[msg.quiz.currentQuestion];
            const updatedQuestions = [...msg.quiz.questions];
            updatedQuestions[msg.quiz.currentQuestion] = {
                ...currentQ,
                userAnswer: answerIndex
            };

            const isLastQuestion = msg.quiz.currentQuestion === msg.quiz.questions.length - 1;
            if (isLastQuestion && currentSpaceId) {
                // Calculate final score
                const score = updatedQuestions.reduce((acc, q) =>
                    acc + (q.userAnswer === q.correctAnswer ? 1 : 0), 0);

                // Create quiz history entry
                const quizHistory: QuizHistory = {
                    id: messageId,
                    questions: updatedQuestions,
                    score,
                    takenAt: new Date().toISOString(),
                    type: msg.quiz.type
                };

                // Update spaces with new quiz
                setSpaces(current => current.map(space =>
                    space.id === currentSpaceId
                        ? {
                            ...space,
                            quizzes: [
                                ...space.quizzes.filter(q => q.id !== messageId),
                                quizHistory
                            ],
                            updatedAt: new Date().toISOString()
                        }
                        : space
                ));

                // Save to KV
                fetch(`/api/spaces/${currentSpaceId}/quizzes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(quizHistory)
                }).catch(err => {
                    console.error('Failed to save quiz:', err);
                    toast.error('Failed to save quiz results');
                });

                // Remove quiz message from chat if it's a session quiz
                if (msg.quiz.type === 'session') {
                    return null; // This message will be filtered out
                }

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
        }).filter(Boolean)); // Filter out null messages
    };

    const handleQuizRetry = (quizId: string) => {
        // Find the quiz in the current space
        const currentSpace = spaces.find(s => s.id === currentSpaceId);
        if (!currentSpace) return;

        const quiz = currentSpace.quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        // Reset the quiz state
        const updatedQuiz = {
            ...quiz,
            questions: quiz.questions.map(q => ({ ...q, userAnswer: undefined })),
            score: undefined
        };

        // Update the space's quizzes
        setSpaces(current => current.map(space =>
            space.id === currentSpaceId
                ? {
                    ...space,
                    quizzes: space.quizzes.map(q =>
                        q.id === quizId ? updatedQuiz : q
                    )
                }
                : space
        ));

        // Create a new message with the quiz
        const quizMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: quiz.type === 'session' ? 'Session Quiz' : 'Topic Quiz',
            quiz: {
                questions: updatedQuiz.questions,
                currentQuestion: 0,
                isComplete: false,
                type: quiz.type
            }
        };

        setMessages(current => [...current, quizMessage]);
    };

    // Update handleGenerateSessionQuiz for more personalized session quizzes
    const handleGenerateSessionQuiz = async () => {
        setIsLoading(true);
        setShowQuizUpdateNotification(false);  // Clear notification when generating new quiz

        try {
            const conversationHistory = prepareMessagesForAPI(messages);
            const quizLength = determineQuizLength('', 'session', messages);
            const previousMistakes = getPreviousQuizMistakes(messages);
            const quizHistory = analyzeQuizHistory(messages);

            // If this is a retake, include previous quiz performance
            const previousSessionQuiz = messages
                .filter(m => m.quiz?.type === 'session')
                .pop();

            // Extract key topics with improved prompt
            const keyTopicsPrompt = {
                role: "user",
                parts: [{
                    text: `Analyze our conversation and identify the most important topics discussed.
                    Consider:
                    1. Core concepts that were explained in detail
                    2. Topics that led to follow-up questions
                    3. Technical or complex ideas that were broken down
                    Format your response EXACTLY as a JSON array of objects:
                    [
                        {
                            "topic": "Main topic name",
                            "importance": "high|medium|low",
                            "complexity": "basic|intermediate|advanced"
                        }
                    ]`
                }]
            };

            // Get key topics
            const topicsResponse = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [...conversationHistory, keyTopicsPrompt]
                }),
            });

            let keyTopics = [];
            try {
                const topicsData = await topicsResponse.json();
                const topicsText = topicsData.candidates[0].content.parts[0].text.trim();
                const jsonMatch = topicsText.match(/\[([\s\S]*?)\]/);
                if (jsonMatch) {
                    keyTopics = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn("Failed to parse key topics:", e);
                keyTopics = messages
                    .filter(m => m.role === 'assistant')
                    .slice(-3)
                    .map(m => ({
                        topic: m.content.slice(0, 50) + "...",
                        importance: "medium",
                        complexity: "intermediate"
                    }));
            }

            // Generate the quiz with improved prompting
            conversationHistory.push({
                role: "user",
                parts: [{
                    text: `Generate a comprehensive quiz with ${quizLength} multiple choice questions.
                    Focus on these key topics:
                    ${keyTopics.map(t => `- ${t.topic} (${t.importance} importance)`).join('\n')}
                    
                    ${previousSessionQuiz ? `
                    This is a retake of a previous quiz. Focus on:
                    1. New content added since the last quiz
                    2. Topics that were challenging in the previous attempt
                    3. Different aspects of previously covered topics
                    ` : ''}

                    ${previousMistakes.length > 0 ? `
                    Include questions about these previously challenging concepts:
                    ${previousMistakes.map(m => `- ${m.question}`).join('\n')}
                    Make these questions more challenging than before.
                    ` : ''}

                    Format your response EXACTLY as a JSON array:
                    [
                        {
                            "question": "Question text covering a key concept",
                            "options": ["option 1", "option 2", "option 3", "option 4"],
                            "correctAnswer": 0,
                            "explanation": "Detailed explanation of why this is correct",
                            "difficulty": "beginner|intermediate|advanced",
                            "topic": "relevant topic from our discussion",
                            "isNewContent": boolean
                        }
                    ]`
                }]
            });

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: conversationHistory }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);

            let quizQuestions;
            try {
                quizQuestions = JSON.parse(data.candidates[0].content.parts[0].text.trim());
            } catch (parseError) {
                const jsonMatch = data.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    quizQuestions = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Failed to parse quiz questions");
                }
            }

            // Create a new message for the session quiz
            const quizMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: previousSessionQuiz ? 'Updated Session Quiz' : 'Session Quiz',
                quiz: {
                    questions: quizQuestions,
                    currentQuestion: 0,
                    isComplete: false,
                    type: 'session'
                }
            };

            setMessages(current => [...current, quizMessage]);

        } catch (err: any) {
            console.error("Session quiz generation error:", err);
            toast.error(err.message || "Failed to generate session quiz");
        } finally {
            setIsLoading(false);
        }
    };

    // Update handleCreateSpace to start with a clean slate
    const handleCreateSpace = async () => {
        const spaceName = prompt("Enter a name for your new learning space:");
        if (!spaceName?.trim()) return;

        // Clear any existing messages first
        setMessages([]);

        const welcomeMessage: Message = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: `Welcome to ${spaceName}! 👋\n\nThis is your learning space for ${spaceName}. You can:\n\n` +
                "• Ask questions and get AI-powered answers\n" +
                "• Take quizzes to test your knowledge\n" +
                "• Review past conversations and quiz results\n\n" +
                "What would you like to learn about today?"
        };

        const newSpace: Space = {
            id: Date.now().toString(),
            name: spaceName.trim(),
            chats: [{
                id: `chat-${Date.now()}`,
                title: "Main Chat",
                messages: [welcomeMessage],
                updatedAt: new Date().toISOString()
            }],
            quizzes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/spaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSpace)
            });

            if (!response.ok) throw new Error('Failed to create space');

            setSpaces(current => [...current, newSpace]);
            setCurrentSpaceId(newSpace.id);
            setMessages([welcomeMessage]); // Set only the welcome message
            toast.success("Space created successfully!");
        } catch (err) {
            toast.error("Failed to create space");
            console.error(err);
        }
    };

    // Update handleDeleteSpace to clear messages when deleting current space
    const handleDeleteSpace = async (spaceId: string) => {
        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${space.name}"? This will remove all chats and quizzes in this space.`
        );

        if (!confirmDelete) return;

        try {
            await fetch(`/api/spaces/${spaceId}`, {
                method: 'DELETE'
            });

            // If we're deleting the current space, clear it
            if (currentSpaceId === spaceId) {
                setCurrentSpaceId(null);
                setMessages([]); // Clear messages
            }

            setSpaces(current => current.filter(s => s.id !== spaceId));
            toast.success("Space deleted successfully");
        } catch (err) {
            toast.error("Failed to delete space");
            console.error(err);
        }
    };

    const handleRenameSpace = async (spaceId: string) => {
        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        const newName = prompt("Enter new name for this space:", space.name);
        if (!newName?.trim() || newName === space.name) return;

        try {
            await fetch(`/api/spaces/${spaceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });

            setSpaces(current => current.map(s =>
                s.id === spaceId ? { ...s, name: newName.trim() } : s
            ));
            toast.success("Space renamed successfully");
        } catch (err) {
            toast.error("Failed to rename space");
        }
    };

    // Update the Dashboard button click handler
    const handleDashboardClick = () => {
        setCurrentSpaceId(null);
        setActiveTab('chat');
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={cn(
                    "border-r border-border flex flex-col transition-all duration-300",
                    "bg-neutral-900",
                    isSidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <h1 className="font-semibold text-lg tracking-tight">EdTutor</h1>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isSidebarCollapsed ? (
                            <PanelRight className="h-4 w-4" />
                        ) : (
                            <PanelRight className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Dashboard Button */}
                <div className={cn("p-2", isSidebarCollapsed ? "flex justify-center" : "flex justify-start")}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "flex items-center w-full",
                            isSidebarCollapsed ? "justify-center" : "justify-start"
                        )}
                        onClick={handleDashboardClick}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        {!isSidebarCollapsed && <span className="ml-2">Dashboard</span>}
                    </Button>
                </div>

                {/* Add Space Button */}
                <div className={cn("p-2", isSidebarCollapsed ? "flex justify-center" : "flex justify-start")}>
                    <Button
                        variant="outline"
                        className="flex items-center w-full border-dashed border-2"
                        onClick={handleCreateSpace}
                    >
                        <Plus className="h-4 w-4" />
                        {!isSidebarCollapsed && <span className="ml-2">Add new space</span>}
                    </Button>
                </div>

                {/* Spaces Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Spaces Header */}
                    {!isSidebarCollapsed && (
                        <div className="px-4 py-2">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Spaces
                            </h2>
                        </div>
                    )}

                    {/* Spaces List */}
                    <ScrollArea className="flex-1">
                        <div className="px-2 py-2 space-y-1">
                            {sortedSpaces.map((space) => {
                                const lastChat = space.chats[0]?.messages.slice(-1)[0];
                                const lastQuiz = space.quizzes.slice(-1)[0];

                                return (
                                    <div
                                        key={space.id}
                                        onClick={() => handleSpaceSelect(space.id)}
                                        className={cn(
                                            "group rounded-lg transition-colors cursor-pointer",
                                            isSidebarCollapsed ? "flex justify-center px-2 py-2" : "flex justify-start px-3 py-2",
                                            currentSpaceId === space.id
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Folder className={cn(
                                                "h-4 w-4 shrink-0",
                                                currentSpaceId === space.id ? "text-accent-foreground" : "text-muted-foreground"
                                            )} />
                                            {!isSidebarCollapsed && (
                                                <span className="font-medium truncate">
                                                    {space.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col h-full">
                {currentSpaceId ? (
                    <>
                        {/* Space Header with Centered Tabs */}
                        <div className="flex-none border-none border-border">
                            <div className="max-w-[780px] mx-auto w-full px-4 relative">
                                <div className="flex items-center justify-between py-6">
                                    {/* Remove title and center the tabs */}
                                    <div className="flex-1" /> {/* Spacer */}
                                    <div className="inline-flex items-center bg-secondary rounded-2xl p-1">
                                        <TabButton
                                            active={activeTab === 'chat'}
                                            onClick={() => setActiveTab('chat')}
                                            icon={<MessageSquare className="h-4 w-4" />}
                                            label="Chat"
                                            className={cn(
                                                "transition-colors",
                                                activeTab === 'chat'
                                                    ? "bg-background text-foreground"
                                                    : "hover:bg-background/50 text-muted-foreground"
                                            )}
                                        />
                                        <TabButton
                                            active={activeTab === 'quizzes'}
                                            onClick={() => setActiveTab('quizzes')}
                                            icon={<Brain className="h-4 w-4" />}
                                            label="Quiz"
                                            className={cn(
                                                "transition-colors",
                                                activeTab === 'quizzes'
                                                    ? "bg-background text-foreground"
                                                    : "hover:bg-background/50 text-muted-foreground"
                                            )}
                                        />
                                        <TabButton
                                            active={activeTab === 'resources'}
                                            onClick={() => setActiveTab('resources')}
                                            icon={<BookOpen className="h-4 w-4" />}
                                            label="Resources"
                                            className={cn(
                                                "transition-colors",
                                                activeTab === 'resources'
                                                    ? "bg-background text-foreground"
                                                    : "hover:bg-background/50 text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 flex justify-end"> {/* Spacer with theme toggle */}
                                        <ThemeToggle variant="ghost" size="icon" className="h-8 w-8" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'chat' && (
                                <div className="h-full max-w-[760px] mx-auto">
                                    <Chat
                                        messages={messages}
                                        input={input}
                                        handleSubmit={handleChatSubmit}
                                        handleInputChange={(e) => setInput(e.target.value)}
                                        isGenerating={isLoading}
                                        onGenerateQuiz={handleGenerateQuiz}
                                        onQuizAnswer={handleQuizAnswer}
                                        onQuizRetry={handleQuizRetry}
                                        showQuizUpdateNotification={showQuizUpdateNotification}
                                        onGenerateSessionQuiz={() => {
                                            setActiveTab('quizzes');
                                            handleGenerateSessionQuiz();
                                        }}
                                    >
                                        {messages.map(message => (
                                            <ChatMessage
                                                key={message.id}
                                                {...message}
                                                actions={
                                                    message.role === "assistant" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                onClick={() => handleCopy(message.content)}
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                            {!message.quiz && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => handleGenerateQuiz(message.id, message.content)}
                                                                >
                                                                    <Brain className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )
                                                }
                                                setActiveTab={setActiveTab}
                                            />
                                        ))}
                                    </Chat>
                                </div>
                            )}
                            {activeTab === 'quizzes' && (
                                <QuizHistoryTab
                                    quizzes={spaces.find(s => s.id === currentSpaceId)?.quizzes || []}
                                    onRetakeQuiz={handleQuizRetry}
                                />
                            )}
                            {activeTab === 'resources' && (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-semibold mb-2">Resources Coming Soon!</h3>
                                        <p>We're working on bringing you helpful learning materials.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex-none border-b border-border">
                            <div className="max-w-[780px] mx-auto w-full px-4 relative">
                                <div className="flex items-center justify-between py-2">
                                    <h2 className="text-lg font-semibold">Dashboard</h2>
                                    <ThemeToggle variant="ghost" size="icon" className="h-8 w-8" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="max-w-[780px] mx-auto">
                                {/* Welcome Section */}
                                <div className="mb-8 text-center">
                                    <h1 className="text-2xl font-bold mb-2">Welcome to Learning Spaces! 🎓</h1>
                                    <p className="text-muted-foreground">
                                        Organize your learning journey with dedicated spaces for different topics.
                                    </p>
                                </div>

                                {/* Quick Actions Grid */}
                                <div className="grid gap-4 mb-8 grid-cols-1 md:grid-cols-2">
                                    {/* Create New Space Card */}
                                    <div className="border border-dashed rounded-lg p-6 hover:border-foreground/50 transition-colors">
                                        <div className="flex flex-col items-center text-center gap-2">
                                            <div className="p-3 rounded-full bg-primary/10">
                                                <Plus className="h-6 w-6" />
                                            </div>
                                            <h3 className="font-semibold">Create New Space</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Start a new learning journey by creating a dedicated space
                                            </p>
                                            <Button onClick={handleCreateSpace}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                New Space
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Recent Activity Card */}
                                    <div className="border rounded-lg p-6">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="font-semibold">Recent Activity</h3>
                                            {sortedSpaces.length > 0 ? (
                                                <div className="space-y-2">
                                                    {sortedSpaces.slice(0, 3).map(space => (
                                                        <div
                                                            key={space.id}
                                                            onClick={() => handleSpaceSelect(space.id)}
                                                            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                                                        >
                                                            <Folder className="h-4 w-4 shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{space.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Last updated: {new Date(space.updatedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No recent activity to show
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* All Spaces Section */}
                                {sortedSpaces.length > 0 && (
                                    <div className="border rounded-lg p-6">
                                        <h3 className="font-semibold mb-4">All Spaces</h3>
                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                            {sortedSpaces.map(space => (
                                                <div
                                                    key={space.id}
                                                    onClick={() => handleSpaceSelect(space.id)}
                                                    className="border rounded-md p-4 cursor-pointer hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Folder className="h-4 w-4" />
                                                            <span className="font-medium truncate">{space.name}</span>
                                                        </div>
                                                        <SpaceActionsDropdown
                                                            space={space}
                                                            onRename={handleRenameSpace}
                                                            onDelete={handleDeleteSpace}
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        <p>Chats: {space.chats.length}</p>
                                                        <p>Quizzes: {space.quizzes.length}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
