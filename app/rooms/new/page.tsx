import Link from "next/link";
import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { Button } from "@/components/ui/button";

export default function NewRoomPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">部屋を作成</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            作成後に招待URLとルームコードを共有できます。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">戻る</Link>
        </Button>
      </div>
      <CreateRoomForm />
    </main>
  );
}
