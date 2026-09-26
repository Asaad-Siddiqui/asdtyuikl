import AssistantBubble from "@/components/AssistantBubble";

export type ChatRole = "assistant" | "user";

export default function ChatMessage({
  role,
  children,
  typing = false,
}: {
  role: ChatRole;
  children?: React.ReactNode;
  typing?: boolean;
}) {
  if (role === "assistant") {
    return <AssistantBubble typing={typing}>{children}</AssistantBubble>;
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-soft">
        {children}
      </div>
    </div>
  );
}
