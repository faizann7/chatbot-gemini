import { useState } from 'react';
import { Button } from './button';
import { QuizQuestion } from './chat-message';
import { cn } from '@/lib/utils';
import { Check, X, ArrowRight } from 'lucide-react';

interface QuizSectionProps {
    questions: QuizQuestion[];
    currentQuestion: number;
    isComplete: boolean;
    score?: number;
    onAnswer: (answerIndex: number) => void;
    onRetry?: () => void;
}

export function QuizSection({
    questions,
    currentQuestion,
    isComplete,
    score,
    onAnswer,
    onRetry
}: QuizSectionProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const currentQ = questions[currentQuestion];

    const handleAnswerSubmit = () => {
        if (selectedAnswer === null) return;
        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        if (selectedAnswer === null) return;
        onAnswer(selectedAnswer);
        setSelectedAnswer(null);
        setShowFeedback(false);
    };

    if (isComplete) {
        const percentage = Math.round((score || 0) / questions.length * 100);

        return (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Quiz Complete! 🎉</h3>
                    <span className="text-lg font-bold">{percentage}%</span>
                </div>
                <p>You scored {score} out of {questions.length} questions correctly.</p>

                <div className="mt-6">
                    <h4 className="font-medium mb-3">Review:</h4>
                    {questions.map((q, i) => (
                        <div key={i} className="mb-4 p-3 rounded-lg bg-background">
                            <p className="font-medium flex items-center gap-2">
                                {q.userAnswer === q.correctAnswer ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                )}
                                {q.question}
                            </p>
                            <div className="ml-6 mt-2">
                                {q.options.map((option, j) => (
                                    <div
                                        key={j}
                                        className={cn(
                                            "p-2 my-1 rounded text-sm",
                                            j === q.correctAnswer && "bg-green-100 dark:bg-green-900",
                                            q.userAnswer === j && j !== q.correctAnswer && "bg-red-100 dark:bg-red-900"
                                        )}
                                    >
                                        {option}
                                    </div>
                                ))}
                                {q.userAnswer !== q.correctAnswer && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {q.explanation}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {onRetry && (
                    <Button
                        className="mt-4 w-full"
                        onClick={onRetry}
                    >
                        Retry Quiz
                    </Button>
                )}
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
                        disabled={showFeedback}
                        className={cn(
                            "w-full text-left p-3 rounded transition-colors",
                            showFeedback && i === currentQ.correctAnswer && "bg-green-100 dark:bg-green-900",
                            showFeedback && i === selectedAnswer && i !== currentQ.correctAnswer && "bg-red-100 dark:bg-red-900",
                            !showFeedback && selectedAnswer === i && "bg-primary text-primary-foreground",
                            !showFeedback && selectedAnswer !== i && "bg-muted hover:bg-muted/80"
                        )}
                        onClick={() => !showFeedback && setSelectedAnswer(i)}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {showFeedback && (
                <div className={cn(
                    "mt-4 p-3 rounded-lg text-sm",
                    selectedAnswer === currentQ.correctAnswer ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                )}>
                    <p className="font-medium">
                        {selectedAnswer === currentQ.correctAnswer ? "✅ Correct!" : "❌ Incorrect"}
                    </p>
                    <p className="mt-1">{currentQ.explanation}</p>
                </div>
            )}

            <div className="mt-4 flex gap-2">
                {!showFeedback ? (
                    <Button
                        className="w-full"
                        disabled={selectedAnswer === null}
                        onClick={handleAnswerSubmit}
                    >
                        Submit Answer
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        onClick={handleNextQuestion}
                    >
                        Next Question <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
} 