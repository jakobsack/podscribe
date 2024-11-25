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
  const [activeWord, setActiveWord] = useState<Word | undefined>(undefined);

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
    setActiveWord(word);
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
      <div className="flex flex-row">
        <div className="flex-1">
          {part.sections.map((section) => (
            <div
              key={section.section.id}
              className="flex flex-col border-b border-gray-400"
            >
              <div className="flex-1 flex flex-row bg-gray-100">
                <div className=" flex flex-row">
                  <div className="w-12 text-right">
                    {(
                      section.section.ends_at - section.section.starts_at
                    ).toFixed(2)}
                  </div>
                  <div className="ml-0.5 flex-1">s</div>
                </div>
                <div className=" flex flex-row ml-8">
                  <div className="w-12 text-right">
                    {section.section.words_per_second.toFixed(2)}
                  </div>
                  <div className="ml-0.5 flex-1">wps</div>
                </div>
                <div className="flex-1 ml-8">
                  <span
                    onClick={() => {
                      toggleSectionHidden(section.section.id);
                    }}
                    onKeyDown={() => {
                      toggleSectionHidden(section.section.id);
                    }}
                  >
                    {section.words.some((x) => x.hidden)
                      ? "show all"
                      : "hide all"}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-row flex-wrap mb-2">
                {section.words.map((w) => {
                  const wordColor = getWordColor(w);
                  return (
                    <div
                      key={w.id}
                      className={`group btn sz-sm m-1 ${wordColor}`}
                    >
                      <WordForm word={w} saveFunction={wordSaveFunction} />
                      <svg
                        fill="#000000"
                        xmlns="http://www.w3.org/2000/svg"
                        width="2em"
                        height="2em"
                        viewBox="0 0 479.79 479.79"
                        className="border-l pl-1 w-3"
                        onClick={() => {
                          setActiveWord(w);
                        }}
                        onKeyDown={() => {
                          setActiveWord(w);
                        }}
                      >
                        <title>Settings</title>
                        <g id="SVGRepo_iconCarrier">
                          <g>
                            <path d="M478.409,116.617c-0.368-4.271-3.181-7.94-7.2-9.403c-4.029-1.472-8.539-0.47-11.57,2.556l-62.015,62.011l-68.749-21.768 l-21.768-68.748l62.016-62.016c3.035-3.032,4.025-7.543,2.563-11.565c-1.477-4.03-5.137-6.837-9.417-7.207 c-37.663-3.245-74.566,10.202-101.247,36.887c-36.542,36.545-46.219,89.911-29.083,135.399c-1.873,1.578-3.721,3.25-5.544,5.053 L19.386,373.152c-0.073,0.071-0.145,0.149-0.224,0.219c-24.345,24.346-24.345,63.959,0,88.309 c24.349,24.344,63.672,24.048,88.013-0.298c0.105-0.098,0.201-0.196,0.297-0.305l193.632-208.621 c1.765-1.773,3.404-3.628,4.949-5.532c45.5,17.167,98.9,7.513,135.474-29.056C468.202,191.181,481.658,154.275,478.409,116.617z M75.98,435.38c-8.971,8.969-23.5,8.963-32.47,0c-8.967-8.961-8.967-23.502,0-32.466c8.97-8.963,23.499-8.963,32.47,0 C84.947,411.878,84.947,426.419,75.98,435.38z" />
                          </g>
                        </g>
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="w-40 border-b border-l border-gray-400">
          <p>Info</p>
          {activeWord ? (
            <>
              <div
                className={`group btn sz-sm m-1 ${getWordColor(activeWord)}`}
              >
                <span className={activeWord.hidden ? "line-through" : ""}>
                  {activeWord.overwrite || activeWord.text}
                </span>
              </div>
              <span
                className="border-l pl-1 w-3"
                onClick={() => {
                  toggleWordHidden(activeWord.id);
                }}
                onKeyDown={() => {
                  toggleWordHidden(activeWord.id);
                }}
              >
                {activeWord.hidden ? "Show word" : "Hide word"}
              </span>
            </>
          ) : (
            <p>Select a word</p>
          )}
        </div>
      </div>
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
    <span
      onClick={toggleShowEdit}
      onKeyDown={toggleShowEdit}
      className={word.hidden ? "line-through" : ""}
    >
      {word.overwrite || word.text}
    </span>
  );
};

function getWordColor(word: Word): string {
  if (word.overwrite) return "bg-gray-200";
  if (word.probability > 0.99) return "bg-blue-200";
  if (word.probability > 0.9) return "bg-green-200";
  if (word.probability > 0.7) return "bg-yellow-200";
  return "bg-red-200";
}
