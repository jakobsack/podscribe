import type { Episode, EpisodeSpeaker, Part, Speaker } from "../definitions";

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

export const TranscriptTable = ({
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
      {newParts.map((x) => {
        return (
          <div
            key={x.id}
            className={`flex flex-row items-stretch ${x.speaker_id === highlightedSpeaker ? "bg-slate-100" : ""}`}
          >
            <div className="w-40">{x.speaker}</div>
            <SpeakerParts parts={x.parts} />
          </div>
        );
      })}
    </div>
  );
};

interface bar {
  parts: NewPart[];
}

export const SpeakerParts = ({ parts }: bar) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x) => (
          <div key={x.id} className="flex flex-row">
            <div className="w-20">{x.start.toFixed(2)}</div>
            <div className="flex-1">{x.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
