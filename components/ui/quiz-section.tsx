import { useState } from 'react';
import { Button } from './button';
import { QuizQuestion } from './chat-message';
import { cn } from '@/lib/utils';

interface QuizSectionProps {
    questions: QuizQuestion[];
    currentQuestion: number;
    isComplete: boolean;
    score?: number;
    onAnswer: (answerIndex: number) => void;
}

export function QuizSection({
    questions,
    currentQuestion,
    isComplete,
    score,
    onAnswer
}: QuizSectionProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const currentQ = questions[currentQuestion];

    if (isComplete) {
        return (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
                <h3 className="font-semibold mb-2">Quiz Complete! 🎉</h3>
                <p>You scored {score} out of {questions.length} questions correctly.</p>
                <div className="mt-4">
                    {questions.map((q, i) => (
                        <div key={i} className="mb-4">
                            <p className="font-medium">{q.question}</p>
                            <div className="ml-4">
                                {q.options.map((option, j) => (
                                    <div
                                        key={j}
                                        className={cn(
                                            "p-2 my-1 rounded",
                                            j === q.correctAnswer && "bg-green-100 dark:bg-green-900",
                                            q.userAnswer === j && j !== q.correctAnswer && "bg-red-100 dark:bg-red-900"
                                        )}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold mb-2">Question {currentQuestion + 1} of {questions.length}</h3>
            <p className="mb-4">{currentQ.question}</p>
            <div className="space-y-2">
                {currentQ.options.map((option, i) => (
                    <button
                        key={i}
                        className={cn(
                            "w-full text-left p-3 rounded transition-colors",
                            selectedAnswer === i
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                        onClick={() => setSelectedAnswer(i)}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <Button
                className="mt-4"
                disabled={selectedAnswer === null}
                onClick={() => {
                    if (selectedAnswer !== null) {
                        onAnswer(selectedAnswer);
                        setSelectedAnswer(null);
                    }
                }}
            >
                Submit Answer
            </Button>
        </div>
    );
} 