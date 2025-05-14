import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Memories",
  description: "View and manage your agent's memories",
};

export default function MemoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
