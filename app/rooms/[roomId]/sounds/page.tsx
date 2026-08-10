import { redirect } from "next/navigation";

type Props = { params: Promise<{ roomId: string }> };

/** Sound add/delete moved onto the room board. */
export default async function SoundsPage({ params }: Props) {
  const { roomId } = await params;
  redirect(`/rooms/${roomId}`);
}
