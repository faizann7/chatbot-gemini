"use client";

import { useState } from "react";
import Chat from "@/components/ui/chat";
import { cn } from "@/lib/utils";
import type { Message } from "@/components/ui/chat-message";

const API_KEY = "AIzaSyCC6XshnCnVn8PqGaveDZ1Ba8csAt7UvPY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export function ChatDemo() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const append = (message: Message) => {
        setMessages(current => [...current, message]);
    };

    const handleChatSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim()) return;

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

    return (
        <div
            className={cn(
                "flex flex-col h-[calc(100vh-theme(spacing.16))]",
                "max-w-4xl mx-auto w-full",
                "pt-4 pb-[8vh]"
            )}
        >
            <Chat
                messages={messages}
                handleSubmit={handleChatSubmit}
                input={input}
                handleInputChange={(e) => setInput(e.target.value)}
                isLoading={isLoading}
                error={error}
                suggestions={[
                    "Tell me a joke",
                    "What's the weather like today?",
                    "Who won the 2022 FIFA World Cup?",
                ]}
                className={cn(
                    "h-full",
                    "rounded-lg border bg-background shadow-sm",
                    "grid grid-rows-[1fr,auto]"
                )}
                messagesClassName="px-4 py-2 overflow-y-auto"
                inputClassName="p-4 border-t"
            />
        </div>
    );
}
