import { useEffect, useState } from "react";
import type { KeyboardEventHandler } from "react";
import type {
  Episode,
  EpisodeSpeaker,
  Part,
  PartDisplay,
  Speaker,
  Word,
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
            className={`flex flex-row items-stretch border-b-2 border-gray-300 ${x.speaker_id === highlightedSpeaker ? "bg-slate-100" : ""}`}
          >
            <div className="w-40 border-r border-gray-200">{x.speaker}</div>
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
        {parts.map((x, i, a) => (
          <div
            key={x.id}
            className={`flex flex-row ${i === a.length - 1 ? "" : "border-b border-gray-200"}`}
          >
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
  const [part, setPart] = useState<PartDisplay | undefined>(undefined);
  const [originalWords, setOriginalWords] = useState<Word[]>([]);
  const [plannedChanges, setPlannedChanges] = useState<Word[]>([]);

  useEffect(() => {
    fetch(`/api/episodes/${episodeId}/parts/${partId}/display`)
      .then((x) => {
        return x.json() as Promise<PartDisplay>;
      })
      .then((x) => {
        setPart(x);
        setOriginalWords(
          JSON.parse(JSON.stringify(x.sections.flatMap((s) => s.words))),
        );
      })
      .catch((error) => console.error(error));
  }, [episodeId, partId]);

  const toggleWordHidden = (id: number) => {
    if (!part) return;

    const word = part.sections.flatMap((x) => x.words).find((x) => x.id === id);
    const originalWord = originalWords.find((x) => x.id === id);
    if (!word || !originalWord) {
      console.error("whoops");
      return;
    }

    word.hidden = !word.hidden;
    const newChanges = plannedChanges.filter((x) => x.id !== id);
    if (JSON.stringify(word) !== JSON.stringify(originalWord)) {
      newChanges.push(word);
    }
    setPlannedChanges(newChanges);
    setPart({ part: part.part, sections: part.sections });
  };

  const toggleSectionHidden = (id: number) => {
    if (!part) return;

    const words = part.sections.find((x) => x.section.id === id)?.words;
    const localWords = words
      ?.map((w) => originalWords.find((x) => x.id === w.id))
      .filter((x) => x);
    if (!words || !localWords || words.length !== localWords.length) {
      console.error("whoops");
      return;
    }

    const hideRest = words.some((x) => !x.hidden);
    let newChanges = plannedChanges;
    for (const word of words.filter((x) => x.hidden !== hideRest)) {
      word.hidden = hideRest;
      newChanges = newChanges.filter((x) => x.id !== word.id);
      const originalWord = originalWords.find((x) => x.id === word.id);
      if (!originalWord) {
        alert("whoops. Lost an object.");
        return;
      }

      if (JSON.stringify(word) !== JSON.stringify(originalWord)) {
        newChanges.push(word);
      }
    }

    setPlannedChanges(newChanges);
    setPart({ part: part.part, sections: part.sections });
  };

  const wordSaveFunction = (newWord: Word) => {
    if (!part) return;

    const word = part.sections
      .flatMap((x) => x.words)
      .find((x) => x.id === newWord.id);
    const originalWord = originalWords.find((x) => x.id === newWord.id);
    if (!word || !originalWord) {
      console.error("whoops");
      return;
    }

    word.overwrite = newWord.overwrite === word.text ? "" : newWord.overwrite;

    const newChanges = plannedChanges.filter((x) => x.id !== newWord.id);
    if (JSON.stringify(word) !== JSON.stringify(originalWord)) {
      newChanges.push(word);
    }
    setPlannedChanges(newChanges);
    setPart({ part: part.part, sections: part.sections });
  };

  const _save_changes = async (
    episodeId: number,
    partId: number,
    words: Word[],
  ): Promise<void> => {
    for (const word of words) {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const body = JSON.stringify(word);
      await fetch(
        `/api/episodes/${episodeId}/parts/${partId}/sections/${word.section_id}/words/${word.id}`,
        { method: "PUT", headers, body },
      );
    }
  };

  const saveChanges = () => {
    _save_changes(episodeId, partId, plannedChanges);
    toggleShowEdit();
  };

  return part ? (
    <div className="flex-1">
      {part.sections.map((section) => (
        <div
          key={section.section.id}
          className="flex flex-row border-b border-gray-400"
        >
          <div className="w-24">
            <div className=" flex flex-row">
              <div className="w-12 text-right">
                {(section.section.ends_at - section.section.starts_at).toFixed(
                  2,
                )}
              </div>
              <div className="ml-0.5 flex-1">s</div>
            </div>
            <div className=" flex flex-row">
              <div className="w-12 text-right">
                {section.section.words_per_second.toFixed(2)}
              </div>
              <div className="ml-0.5 flex-1">wps</div>
            </div>
          </div>
          <div className="flex-1 flex flex-row flex-wrap mb-2">
            {section.words.map((w) => {
              const wordColor =
                w.probability > 0.99
                  ? "bg-blue-200"
                  : w.probability > 0.9
                    ? "bg-green-200"
                    : w.probability > 0.7
                      ? "bg-yellow-200"
                      : "bg-red-200";
              return (
                <div key={w.id} className={`group btn sz-sm m-1 ${wordColor}`}>
                  <WordForm word={w} saveFunction={wordSaveFunction} />
                  <span
                    className="border-l pl-1"
                    onClick={() => {
                      toggleWordHidden(w.id);
                    }}
                    onKeyDown={() => {
                      toggleWordHidden(w.id);
                    }}
                  >
                    {w.hidden ? "+" : "-"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-10 bg-blue-300">
            <span
              className="border-l pl-1"
              onClick={() => {
                toggleSectionHidden(section.section.id);
              }}
              onKeyDown={() => {
                toggleSectionHidden(section.section.id);
              }}
            >
              {section.words.some((x) => x.hidden) ? "show all" : "hide all"}
            </span>
          </div>
        </div>
      ))}
      <div className="flex flex-row">
        <div
          className="btn variant-soft p-1"
          onClick={toggleShowEdit}
          onKeyDown={toggleShowEdit}
        >
          Cancel
        </div>
        <div
          className="btn variant-primary p-1 ml-3"
          onClick={saveChanges}
          onKeyDown={saveChanges}
        >
          Save {plannedChanges.length} changes
        </div>
      </div>
    </div>
  ) : (
    <p>Loading</p>
  );
};

export interface WordFormParams {
  word: Word;
  saveFunction: (word: Word) => void;
}

export const WordForm = ({ word, saveFunction }: WordFormParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  const keyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.code === "Escape") {
      toggleShowEdit();
      return;
    }

    if (event.code !== "Enter") {
      return;
    }

    word.overwrite = event.currentTarget.value;
    saveFunction(word);
    toggleShowEdit();
  };

  return showEdit ? (
    <input
      type="text"
      defaultValue={word.overwrite || word.text}
      onKeyDown={keyDown}
      className="w-20"
    />
  ) : (
    <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
      {word.overwrite || word.text}
    </span>
  );
};
