import { redirect } from "next/navigation";

type Props = { params: Promise<{ roomId: string }> };

/** Deep links keep working; settings UI opens as an overlay on the board. */
export default async function RoomSettingsPage({ params }: Props) {
  const { roomId } = await params;
  redirect(`/rooms/${roomId}?settings=1`);
}
