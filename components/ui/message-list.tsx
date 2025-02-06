import {
  ChatMessage,
  type ChatMessageProps,
  type Message,
} from "@/components/ui/chat-message"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { QuizSection } from "./quiz-section"

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>

interface MessageListProps {
  messages: Message[]
  showTimeStamps?: boolean
  isTyping?: boolean
  messageOptions?:
  | AdditionalMessageOptions
  | ((message: Message) => AdditionalMessageOptions)
  onQuizAnswer?: (messageId: string, answerIndex: number) => void
  onQuizRetry?: (messageId: string) => void
}

export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
  onQuizAnswer,
  onQuizRetry,
}: MessageListProps) {
  return (
    <div className="space-y-4 overflow-visible">
      {messages.map((message, index) => {
        const additionalOptions =
          typeof messageOptions === "function"
            ? messageOptions(message)
            : messageOptions

        return (
          <div key={message.id}>
            <ChatMessage
              showTimeStamp={showTimeStamps}
              {...message}
              {...additionalOptions}
            />
            {message.quiz && (
              <div className="ml-11">
                <QuizSection
                  {...message.quiz}
                  onAnswer={(answerIndex) => onQuizAnswer?.(message.id, answerIndex)}
                  onRetry={() => onQuizRetry?.(message.id)}
                />
              </div>
            )}
          </div>
        )
      })}
      {isTyping && <TypingIndicator />}
    </div>
  )
}
