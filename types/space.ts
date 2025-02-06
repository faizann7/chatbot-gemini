import { Message } from "@/components/ui/chat-message"

export interface Space {
    id: string
    name: string
    description?: string
    chats: ChatHistory[]
    quizzes: QuizHistory[]
    createdAt: string
    updatedAt: string
}

export interface ChatHistory {
    id: string
    title: string
    messages: Message[]
    updatedAt: string
}

export interface QuizHistory {
    id: string
    questions: QuizQuestion[]
    score?: number
    takenAt: string
    type: 'message' | 'session'
}

export interface QuizQuestion {
    question: string
    options: string[]
    correctAnswer: number
    userAnswer?: number
    explanation?: string
} 