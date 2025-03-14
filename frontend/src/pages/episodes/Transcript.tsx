import type { Approval, Episode, EpisodeSpeaker, Part, Speaker } from "../../definitions";
import { SpeakerPartsComponent } from "./SpeakerParts";

interface TranscriptParams {
  parts: Part[];
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  highlightedSpeaker: number;
  approvals: Approval[];
}

export interface SpeakerPart {
  id: number;
  speaker: string;
  speaker_id: number;
  part_type: number;
  parts: ReducedPart[];
}

export interface ReducedPart {
  id: number;
  approvals: number;
  text: string;
  start: number;
}

export const TranscriptComponent = ({
  parts,
  speakers,
  episodeSpeakers,
  highlightedSpeaker,
  approvals,
}: TranscriptParams) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] = speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name || "UNKNOWN";
  }

  let lastSpeaker = "";
  let lastType = 0;
  const newParts: SpeakerPart[] = [];
  for (const part of parts) {
    if (!part.text) {
      continue;
    }

    const speaker = speakerNames[part.episode_speaker_id];
    const somepart: ReducedPart = {
      id: part.id,
      text: part.text,
      start: part.starts_at,
      approvals: approvals.filter((x) => x.part_id === part.id).length,
    };

    if (speaker === lastSpeaker && part.part_type === lastType) {
      newParts[newParts.length - 1].parts.push(somepart);
    } else {
      lastSpeaker = speaker;
      lastType = part.part_type;
      newParts.push({
        id: part.id,
        speaker: speaker,
        speaker_id: part.episode_speaker_id,
        part_type: part.part_type,
        parts: [somepart],
      });
    }
  }

  return (
    <div className="flex flex-col">
      {newParts.map((x, i, a) => {
        return (
          <SpeakerPartsComponent
            key={x.id}
            speakerPart={x}
            isLastRow={i === a.length - 1}
            isHighlighted={x.speaker_id === highlightedSpeaker}
          />
        );
      })}
    </div>
  );
};
