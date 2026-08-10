import { redirect } from "next/navigation";

type Props = { params: Promise<{ roomId: string }> };

/** Member management moved onto the room board participants column. */
export default async function MembersPage({ params }: Props) {
  const { roomId } = await params;
  redirect(`/rooms/${roomId}`);
}
