import { ObsPlayer } from "@/components/obs/obs-player";

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ token?: string; debug?: string }>;
};

export default async function ObsPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const sp = await searchParams;
  const token = sp.token ?? "";
  const debug = sp.debug === "1";

  if (!token) {
    return (
      <main className="min-h-screen bg-transparent p-4 text-sm text-red-600">
        OBSトークンが指定されていません。設定画面で発行した URL を使用してください。
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <ObsPlayer roomId={roomId} token={token} debug={debug} />
    </main>
  );
}
