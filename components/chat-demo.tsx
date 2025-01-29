"use client";

import { useChat } from "ai/react";
import Chat from "@/components/ui/chat";
import { cn } from "@/lib/utils";

const API_KEY = "AIzaSyCC6XshnCnVn8PqGaveDZ1Ba8csAt7UvPY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export function ChatDemo() {
    const {
        messages,
        input,
        setInput,
        append,
        isLoading,
        error,
    } = useChat();

    const handleChatSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim()) return; // Prevent empty messages

        append({ role: "user", content: input });

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
            append({ role: "assistant", content: responseText });

            // Clear input after successful response
            setInput("");
        } catch (error: any) {
            append({ role: "assistant", content: error.message || "An error occurred" });
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
