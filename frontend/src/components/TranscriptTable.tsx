import { useEffect, useState } from "react";
import type {
  Episode,
  EpisodeSpeaker,
  Part,
  PartDisplay,
  Speaker,
} from "../definitions";

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
            <SpeakerParts parts={x.parts} episodeId={episode.id} />
          </div>
        );
      })}
    </div>
  );
};

interface bar {
  parts: NewPart[];
  episodeId: number;
}

export const SpeakerParts = ({ parts, episodeId }: bar) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x) => (
          <div key={x.id} className="flex flex-row">
            <ShowPart episodeId={episodeId} part={x} />
          </div>
        ))}
      </div>
    </div>
  );
};

interface showParams {
  episodeId: number;
  part: NewPart;
}

export const ShowPart = ({ part, episodeId }: showParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  return showEdit ? (
    <PartEditForm
      episodeId={episodeId}
      partId={part.id}
      toggleShowEdit={toggleShowEdit}
    />
  ) : (
    <>
      <div className="w-20 text-right">{part.start.toFixed(2)}</div>
      <div className="flex-1 ml-2">{part.text}</div>
      <div className="w-10 ml-2">
        <p onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
          Edit
        </p>
      </div>
    </>
  );
};

interface params {
  episodeId: number;
  partId: number;
  toggleShowEdit: () => void;
}

export const PartEditForm = ({ episodeId, partId, toggleShowEdit }: params) => {
  const [section, setSection] = useState<PartDisplay | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/episodes/${episodeId}/parts/${partId}/display`)
      .then((x) => {
        return x.json() as Promise<PartDisplay>;
      })
      .then((x) => setSection(x))
      .catch((error) => console.error(error));
  }, [episodeId, partId]);

  return (
    <div className="bg-red-100">
      {section ? (
        <div>
          {section.sections.map((section) => (
            <div key={section.section.id} className="flex flex-row">
              {section.words.map((w) => (
                <div key={w.id} className="mr-1">
                  {w.text}
                </div>
              ))}
            </div>
          ))}
          <p onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
            Cancel
          </p>
        </div>
      ) : (
        <p>Loading</p>
      )}
    </div>
  );
};
