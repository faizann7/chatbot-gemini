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
    setActiveTab?: (tab: string) => void;
    view?: 'compact' | 'detailed';
}

export function QuizSection({
    questions,
    currentQuestion,
    isComplete,
    score,
    onAnswer,
    onRetry,
    setActiveTab,
    view = 'detailed'
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

        if (view === 'compact') {
            return (
                <div className="mt-4 p-4 rounded-2xl border border-border bg-background max-w-[400px]">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold",
                            percentage >= 80 ? "bg-success/10 text-success" :
                                percentage >= 60 ? "bg-warning/10 text-warning" :
                                    "bg-error/10 text-error"
                        )}>
                            {percentage}%
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold">Session Quiz</h4>
                            <p className="text-sm text-muted-foreground">
                                Scored {score} out of {questions.length}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab?.('quizzes')}
                            className="shrink-0"
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 p-6 bg-background rounded-2xl border border-border">
                <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold",
                            percentage >= 80 ? "bg-success/10 text-success" :
                                percentage >= 60 ? "bg-warning/10 text-warning" :
                                    "bg-error/10 text-error"
                        )}>
                            {percentage}%
                        </div>
                        <h3 className="text-xl font-semibold">Quiz Complete!</h3>
                    </div>

                    <p className="text-muted-foreground">
                        You scored {score} out of {questions.length} questions correctly
                    </p>

                    <div className="flex justify-center gap-3">
                        {onRetry && (
                            <Button
                                variant="outline"
                                onClick={onRetry}
                                className="min-w-[120px]"
                            >
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-6">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Question {currentQuestion + 1}:</h3>
                <p className="text-lg">{currentQ.question}</p>

                <div className="space-y-3">
                    {currentQ.options.map((option, i) => (
                        <button
                            key={i}
                            disabled={showFeedback}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-2xl text-base transition-colors",
                                "border border-border hover:border-foreground/50",
                                "bg-background",
                                showFeedback && i === currentQ.correctAnswer && "bg-success/15 text-success border-success",
                                showFeedback && i === selectedAnswer && i !== currentQ.correctAnswer && "bg-error/15 text-error border-error",
                                !showFeedback && selectedAnswer === i && "border-foreground bg-muted",
                                !showFeedback && selectedAnswer !== i && "text-muted-foreground"
                            )}
                            onClick={() => !showFeedback && setSelectedAnswer(i)}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border text-sm",
                                    selectedAnswer === i ? "border-foreground" : "border-muted-foreground",
                                    "transition-colors"
                                )}>
                                    {String.fromCharCode(65 + i)} {/* A, B, C, D */}
                                </span>
                                {option}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {showFeedback && (
                <div className={cn(
                    "p-4 rounded-2xl border text-base",
                    selectedAnswer === currentQ.correctAnswer
                        ? "border-success text-success bg-success/5"
                        : "border-error text-error bg-error/5"
                )}>
                    <p className="font-medium flex items-center gap-2">
                        {selectedAnswer === currentQ.correctAnswer
                            ? "✅ Correct! "
                            : "❌ Incorrect. "}
                        {currentQ.explanation}
                    </p>
                </div>
            )}

            <div className="flex justify-end">
                {!showFeedback ? (
                    <Button
                        className="min-w-[120px]"
                        disabled={selectedAnswer === null}
                        onClick={handleAnswerSubmit}
                    >
                        {currentQuestion === questions.length - 1 ? "Finish Quiz" : "Submit"}
                    </Button>
                ) : (
                    <Button
                        className="min-w-[120px]"
                        onClick={handleNextQuestion}
                    >
                        {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
                    </Button>
                )}
            </div>
        </div>
    );
} 