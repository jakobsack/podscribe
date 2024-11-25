import { useEffect, useState } from "react";
import type { KeyboardEventHandler } from "react";
import type {
  Episode,
  EpisodeSpeaker,
  Part,
  PartDisplay,
  Speaker,
  Word,
} from "../../definitions";

interface foo {
  episode: Episode;
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

interface NewPart {
  id: number;
  text: string;
  start: number;
}

export const TranscriptionViewComponent = ({
  episode,
  parts,
  speakers,
  episodeSpeakers,
  highlightedSpeaker,
}: foo) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] =
      speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name ||
      "UNKNOWN";
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
            <div
              className={`w-40 ${i === a.length - 1 ? "" : "border-r border-gray-200"}`}
            >
              {x.speaker}
            </div>
            <SpeakerPartsComponent parts={x.parts} />
          </div>
        );
      })}
    </div>
  );
};

interface SpeakerPartsParams {
  parts: NewPart[];
}

export const SpeakerPartsComponent = ({ parts }: SpeakerPartsParams) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x, i, a) => (
          <div
            key={x.id}
            className={`flex flex-row ${i === a.length - 1 ? "" : "border-b border-gray-200"}`}
          >
            <div className="w-20 text-right">{x.start.toFixed(2)}</div>
            <div className="flex-1 ml-2">{x.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
