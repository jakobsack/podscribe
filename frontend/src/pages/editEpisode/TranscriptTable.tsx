import type { Episode, EpisodeSpeaker, Part, Speaker } from "../../definitions";
import type { NewPart, SpeakerPart } from "./definitions";
import { SpeakerPartsComponent } from "./SpeakerParts";

interface TranscriptTableParams {
  episode: Episode;
  parts: Part[];
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  highlightedSpeaker: number;
  startAudioAt: (position: number) => void;
  curTime: number;
}

export const TranscriptTableComponent = ({
  episode,
  parts,
  speakers,
  episodeSpeakers,
  highlightedSpeaker,
  startAudioAt,
  curTime,
}: TranscriptTableParams) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] = speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name || "UNKNOWN";
  }

  let lastSpeaker = "";
  let outerid = 1;
  const newParts: SpeakerPart[] = [];
  for (const part of parts) {
    const speaker = speakerNames[part.episode_speaker_id];
    const somepart: NewPart = {
      id: part.id,
      text: part.text,
      start: part.starts_at,
      end: part.ends_at,
      updated_at: part.updated_at,
    };

    if (speaker === lastSpeaker) {
      newParts[newParts.length - 1].parts.push(somepart);
    } else {
      lastSpeaker = speaker;
      newParts.push({
        id: outerid++,
        speaker: speaker,
        episodeSpeakerId: part.episode_speaker_id,
        parts: [somepart],
      });
    }
  }

  return (
    <div className="flex flex-col">
      {newParts.map((x) => {
        return (
          <div
            key={x.id}
            className={`flex flex-row items-stretch border-b-2 border-gray-300 ${x.episodeSpeakerId === highlightedSpeaker ? "bg-slate-100" : ""}`}
          >
            <div className="w-40 border-r border-gray-200">{x.speaker}</div>
            <SpeakerPartsComponent
              parts={x.parts}
              episodeId={episode.id}
              speakers={speakers}
              episodeSpeakers={episodeSpeakers}
              startAudioAt={startAudioAt}
              curTime={curTime}
            />
          </div>
        );
      })}
    </div>
  );
};
