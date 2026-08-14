"use client";

import { Card } from "@/components/ui/Card";
import { useProject } from "@/components/project/ProjectContext";
import { useAssistant } from "@/components/assistant/useAssistant";
import { MessageBubble } from "@/components/assistant/MessageBubble";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";

export default function ChatPage() {
  const { project, suggestedQuestions, chatHistory } = useProject();
  const { messages, ask } = useAssistant(chatHistory, suggestedQuestions);

  return (
    <Card className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Sentinel assistant</h2>
        <p className="mt-0.5 text-sm text-muted">
          Ask anything about {project.name} — land, law, finance, materials or
          demand. Answers cite the underlying evidence.
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} size="md" />
        ))}
      </div>

      <AssistantComposer
        suggestedQuestions={suggestedQuestions}
        onAsk={ask}
        className="border-t border-hairline pt-5"
      />
    </Card>
  );
}
