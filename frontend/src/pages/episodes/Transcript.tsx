import type { Episode, EpisodeSpeaker, Part, Speaker } from "../../definitions";
import { SpeakerPartsComponent } from "./SpeakerParts";

interface TranscriptParams {
  parts: Part[];
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  highlightedSpeaker: number;
}

export interface SpeakerPart {
  id: number;
  speaker: string;
  speaker_id: number;
  parts: ReducedPart[];
}

export interface ReducedPart {
  id: number;
  text: string;
  start: number;
}

export const TranscriptComponent = ({ parts, speakers, episodeSpeakers, highlightedSpeaker }: TranscriptParams) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] = speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name || "UNKNOWN";
  }

  let lastSpeaker = "";
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
    };

    if (speaker === lastSpeaker) {
      newParts[newParts.length - 1].parts.push(somepart);
    } else {
      lastSpeaker = speaker;
      newParts.push({
        id: part.id,
        speaker: speaker,
        speaker_id: part.episode_speaker_id,
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
