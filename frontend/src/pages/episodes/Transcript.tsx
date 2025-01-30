import type { Episode, EpisodeSpeaker, Part, Speaker } from "../../definitions";
import { SpeakerPartsComponent } from "./SpeakerParts";

interface TranscriptParams {
  parts: Part[];
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  highlightedSpeaker: number;
}

interface SpeakerPart {
  id: number;
  speaker: string;
  speaker_id: number;
  parts: NewPart[];
}

export interface NewPart {
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
  let outerid = 1;
  const newParts: SpeakerPart[] = [];
  for (const part of parts) {
    if (!part.text) {
      continue;
    }

    const speaker = speakerNames[part.episode_speaker_id];
    const somepart: NewPart = {
      id: part.id,
      text: part.text,
      start: part.starts_at,
    };

    if (speaker === lastSpeaker) {
      newParts[newParts.length - 1].parts.push(somepart);
    } else {
      lastSpeaker = speaker;
      newParts.push({
        id: outerid++,
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
          <div
            key={x.id}
            className={`flex flex-row items-stretch border-b-2 border-gray-300 ${x.speaker_id === highlightedSpeaker ? "bg-slate-100" : ""}`}
          >
            <div className={`w-40 ${i === a.length - 1 ? "" : "border-r border-gray-200"}`}>{x.speaker}</div>
            <SpeakerPartsComponent parts={x.parts} />
          </div>
        );
      })}
    </div>
  );
};
