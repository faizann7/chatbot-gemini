import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { QuizHistory } from "@/types/space"
import { Brain, Clock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizHistoryTabProps {
    quizzes: QuizHistory[]
    onRetakeQuiz: (quizId: string) => void
}

export function QuizHistoryTab({ quizzes, onRetakeQuiz }: QuizHistoryTabProps) {
    const [selectedQuiz, setSelectedQuiz] = useState<QuizHistory | null>(null)

    // Remove duplicate quizzes by keeping only the latest version
    const uniqueQuizzes = quizzes.reduce((acc, current) => {
        const existingQuiz = acc.find(q => q.id === current.id);
        if (!existingQuiz) {
            acc.push(current);
        }
        return acc;
    }, [] as QuizHistory[]);

    // Sort quizzes by date, newest first
    const sortedQuizzes = [...uniqueQuizzes].sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );

    if (sortedQuizzes.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-4">
                <Brain className="h-12 w-12 text-muted-foreground" />
                <div>
                    <h3 className="text-lg font-semibold">No Quizzes Yet</h3>
                    <p className="text-muted-foreground max-w-md mt-2">
                        Start a chat and generate quizzes to test your knowledge!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex max-w-3xl mx-auto w-full">
            {/* Quiz List */}
            <div className="w-1/3 border-r border-border">
                <div className="p-4">
                    <h3 className="font-semibold mb-4">Quiz History</h3>
                </div>
                <ScrollArea className="h-[calc(100vh-12rem)]">
                    <div className="px-4 space-y-2">
                        {sortedQuizzes.map((quiz) => {
                            const score = quiz.score || 0
                            const percentage = Math.round((score / quiz.questions.length) * 100)

                            return (
                                <button
                                    key={quiz.id}
                                    onClick={() => setSelectedQuiz(quiz)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-colors",
                                        "hover:bg-secondary",
                                        selectedQuiz?.id === quiz.id && "bg-secondary",
                                        "group flex flex-col gap-2"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {quiz.type === 'session' ? 'Session Quiz' : 'Topic Quiz'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 inline-block mr-1" />
                                            {new Date(quiz.takenAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {quiz.questions.length} questions
                                        </span>
                                        <span className={cn(
                                            "flex items-center gap-1",
                                            percentage >= 80 ? "text-green-500" :
                                                percentage >= 60 ? "text-yellow-500" : "text-red-500"
                                        )}>
                                            <Trophy className="h-3 w-3" />
                                            {percentage}%
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* Quiz Details */}
            <div className="flex-1">
                <ScrollArea className="h-full">
                    <div className="p-4">
                        {selectedQuiz ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Quiz Results
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRetakeQuiz(selectedQuiz.id)}
                                    >
                                        Retake Quiz
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {selectedQuiz.questions.map((question, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-4 rounded-lg border",
                                                question.userAnswer === question.correctAnswer
                                                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                                    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                            )}
                                        >
                                            <p className="font-medium mb-2">
                                                {index + 1}. {question.question}
                                            </p>
                                            <div className="space-y-2">
                                                {question.options.map((option, optionIndex) => (
                                                    <div
                                                        key={optionIndex}
                                                        className={cn(
                                                            "p-2 rounded text-sm",
                                                            optionIndex === question.correctAnswer && "bg-green-100 dark:bg-green-900",
                                                            optionIndex === question.userAnswer && optionIndex !== question.correctAnswer && "bg-red-100 dark:bg-red-900"
                                                        )}
                                                    >
                                                        {option}
                                                        {optionIndex === question.userAnswer && " (Your Answer)"}
                                                        {optionIndex === question.correctAnswer && " (Correct)"}
                                                    </div>
                                                ))}
                                            </div>
                                            {question.explanation && (
                                                <p className="mt-3 text-sm text-muted-foreground">
                                                    {question.explanation}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <p>Select a quiz to view details</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
} 