import type { Approval, Episode, EpisodeSpeaker, Part, Speaker } from "../../definitions";
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
  approvals: Approval[];
}

export const TranscriptTableComponent = ({
  episode,
  parts,
  speakers,
  episodeSpeakers,
  highlightedSpeaker,
  startAudioAt,
  curTime,
  approvals,
}: TranscriptTableParams) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] = speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name || "UNKNOWN";
  }

  let lastSpeaker = "";
  let lastType = 0;
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
      approvals: approvals.filter((x) => x.part_id === part.id).length,
    };

    if (speaker === lastSpeaker && part.part_type === lastType) {
      newParts[newParts.length - 1].parts.push(somepart);
    } else {
      lastSpeaker = speaker;
      lastType = part.part_type;
      newParts.push({
        id: outerid++,
        speaker: speaker,
        episodeSpeakerId: part.episode_speaker_id,
        part_type: part.part_type,
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
            className={`flex flex-row items-stretch border-gray-300 border-b-2 dark:border-gray-600 ${x.episodeSpeakerId === highlightedSpeaker ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          >
            <div
              className={`w-40 border-gray-200 border-r dark:border-gray-700 ${x.part_type === 1 && "bg-pink-100 dark:bg-pink-800"}`}
            >
              {x.speaker}
            </div>
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
