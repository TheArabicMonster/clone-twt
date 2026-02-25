import { requireAuth } from "@/lib/auth-helpers";
import { ConversationList } from "@/components/messages/ConversationList";

export const metadata = {
  title: "Messages – araTexT",
  description: "Vos conversations privées",
};

export default async function MessagesPage() {
  const session = await requireAuth();
  const currentUserId = session.user.id;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conversation list — full width on mobile, fixed width on desktop */}
      <div className="flex w-full flex-col border-r border-default-200 md:w-80 lg:w-96">
        <ConversationList currentUserId={currentUserId} />
      </div>

      {/* Empty state — only visible on desktop */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-4 text-default-400 md:flex">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-default-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10 text-default-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Vos messages</p>
          <p className="mt-1 text-sm">
            Sélectionnez une conversation pour commencer
          </p>
        </div>
      </div>
    </div>
  );
}
