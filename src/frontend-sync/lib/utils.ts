import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Room } from "livekit-client"
import type { ReceivedChatMessage, TextStreamData } from "@livekit/components-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function transcriptionToChatMessage(
  transcription: TextStreamData,
  room: Room,
): ReceivedChatMessage {
  const participant =
    room.localParticipant.identity === transcription.participantInfo.identity
      ? room.localParticipant
      : Array.from(room.remoteParticipants.values()).find(
          (p) => p.identity === transcription.participantInfo.identity,
        );

  return {
    id: transcription.streamInfo.id,
    timestamp: transcription.streamInfo.timestamp,
    message: transcription.text,
    from: participant,
  };
}
