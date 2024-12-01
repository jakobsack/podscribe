import { useEffect, useState } from "react";
import type { ChangeEvent, KeyboardEventHandler } from "react";
import type { Episode, EpisodeSpeaker, Part, PartDisplay, SectionDisplay, Speaker, Word } from "../definitions";

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
  episodeSpeakerId: number;
  parts: NewPart[];
}

interface NewPart {
  id: number;
  text: string;
  start: number;
}

export const TranscriptTable = ({ episode, parts, speakers, episodeSpeakers, highlightedSpeaker }: foo) => {
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
            <SpeakerParts
              parts={x.parts}
              episodeId={episode.id}
              episodeSpeakerId={x.episodeSpeakerId}
              speakers={speakers}
              episodeSpeakers={episodeSpeakers}
            />
          </div>
        );
      })}
    </div>
  );
};

interface bar {
  parts: NewPart[];
  episodeId: number;
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

export const SpeakerParts = ({ parts, episodeId, episodeSpeakerId, speakers, episodeSpeakers }: bar) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x, i, a) => (
          <div key={x.id} className={`flex flex-row ${i === a.length - 1 ? "" : "border-b border-gray-200"}`}>
            <ShowPart
              episodeId={episodeId}
              part={x}
              episodeSpeakerId={episodeSpeakerId}
              speakers={speakers}
              episodeSpeakers={episodeSpeakers}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface showParams {
  episodeId: number;
  part: NewPart;
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

export const ShowPart = ({ part, episodeId, episodeSpeakerId, speakers, episodeSpeakers }: showParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  return showEdit ? (
    <PartEditForm
      episodeId={episodeId}
      partId={part.id}
      toggleShowEdit={toggleShowEdit}
      episodeSpeakerId={episodeSpeakerId}
      speakers={speakers}
      episodeSpeakers={episodeSpeakers}
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
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

export const PartEditForm = ({
  episodeId,
  partId,
  toggleShowEdit,
  episodeSpeakerId,
  speakers,
  episodeSpeakers,
}: params) => {
  const [part, setPart] = useState<PartDisplay | undefined>(undefined);
  const [originalPart, setOriginalPart] = useState<PartDisplay | undefined>(undefined);

  const [activeWord, setActiveWord] = useState<Word | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/episodes/${episodeId}/parts/${partId}/display`)
      .then((x) => {
        return x.json() as Promise<PartDisplay>;
      })
      .then((x) => {
        setPart(x);
        setOriginalPart(JSON.parse(JSON.stringify(x)));
      })
      .catch((error) => console.error(error));
  }, [episodeId, partId]);

  const toggleWordHidden = (id: number) => {
    if (!part) return;

    const word = part.sections.flatMap((x) => x.words).find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    word.hidden = !word.hidden;
    setPart({ part: part.part, sections: part.sections });
    setActiveWord(word);
  };

  const toggleSectionHidden = (id: number) => {
    if (!part) return;

    const words = part.sections.find((x) => x.section.id === id)?.words;
    if (!words) {
      console.error("whoops");
      return;
    }

    const hideRest = words.some((x) => !x.hidden);
    for (const word of words.filter((x) => x.hidden !== hideRest)) {
      word.hidden = hideRest;
    }

    setPart({ part: part.part, sections: part.sections });
  };

  const downNew = (id: number) => {
    if (!part) return;

    const section = part.sections.find((x) => x.words.some((y) => y.id === id));
    if (!section) {
      console.error("whoops");
      return;
    }

    const word = section.words.find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    const newSectionWords = section.words.filter((x) => x.ends_at > word.starts_at);
    const oldSectionWords = section.words.filter((x) => x.starts_at < word.starts_at);

    if (oldSectionWords.length === 0) {
      console.log("Not creating new down section as existing section would be empty");
      return;
    }

    const newSectionId = Math.min(0, ...part.sections.map((x) => x.section.id)) - 1;

    const starts_at = newSectionWords[0].starts_at;
    const ends_at = newSectionWords[newSectionWords.length - 1].ends_at;
    const newSection: SectionDisplay = {
      section: {
        corrected: false,
        starts_at: starts_at,
        ends_at: ends_at,
        id: newSectionId,
        text: "",
        words_per_second: newSectionWords.length / (ends_at - starts_at),
      },
      words: newSectionWords,
    };

    section.words = oldSectionWords;
    section.section.ends_at = section.words[section.words.length - 1].ends_at;

    part.sections.splice(part.sections.indexOf(section) + 1, 0, newSection);

    setPart({ part: part.part, sections: part.sections });
  };

  const downMove = (id: number): void => {
    if (!part) return;

    const section = part.sections.find((x) => x.words.some((y) => y.id === id));
    if (!section) {
      console.error("whoops");
      return;
    }

    const word = section.words.find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    const nextSection = part.sections[part.sections.indexOf(section) + 1];

    const oldSectionWords = section.words.filter((x) => x.starts_at < word.starts_at);

    if (oldSectionWords.length === 0 && section.section.id > 0 && nextSection.section.id < 0) {
      // Is old section an existing one and next a temporary one? Then switch.
      upMove(nextSection.words[nextSection.words.length - 1].id);
      return;
    }

    if (oldSectionWords.length === 0) part.sections.splice(part.sections.indexOf(section), 1);
    else {
      section.words = oldSectionWords;
      section.section.ends_at = section.words[section.words.length - 1].ends_at;
    }

    nextSection.words = section.words.filter((x) => x.ends_at > word.starts_at).concat(nextSection.words);
    nextSection.section.starts_at = nextSection.words[0].starts_at;
    nextSection.section.words_per_second =
      nextSection.words.length / (nextSection.section.ends_at - nextSection.section.starts_at);

    setPart({ part: part.part, sections: part.sections });
  };

  const upNew = (id: number) => {
    if (!part) return;

    const section = part.sections.find((x) => x.words.some((y) => y.id === id));
    if (!section) {
      console.error("whoops");
      return;
    }

    const word = section.words.find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    const newSectionWords = section.words.filter((x) => x.starts_at < word.ends_at);
    const oldSectionWords = section.words.filter((x) => x.starts_at > word.starts_at);

    if (oldSectionWords.length === 0) {
      console.log("Not creating new up section as existing section would be empty");
      return;
    }

    const newSectionId = Math.min(0, ...part.sections.map((x) => x.section.id)) - 1;

    const starts_at = newSectionWords[0].starts_at;
    const ends_at = newSectionWords[newSectionWords.length - 1].ends_at;
    const newSection: SectionDisplay = {
      section: {
        corrected: false,
        starts_at: starts_at,
        ends_at: ends_at,
        id: newSectionId,
        text: "",
        words_per_second: newSectionWords.length / (ends_at - starts_at),
      },
      words: newSectionWords,
    };

    section.words = oldSectionWords;
    section.section.starts_at = section.words[0].starts_at;

    part.sections.splice(part.sections.indexOf(section), 0, newSection);

    setPart({ part: part.part, sections: part.sections });
  };

  const upMove = (id: number): void => {
    if (!part) return;

    const section = part.sections.find((x) => x.words.some((y) => y.id === id));
    if (!section) {
      console.error("whoops");
      return;
    }

    const word = section.words.find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    const previousSection = part.sections[part.sections.indexOf(section) - 1];
    const oldSectionWords = section.words.filter((x) => x.starts_at > word.starts_at);

    if (oldSectionWords.length === 0 && section.section.id > 0 && previousSection.section.id < 0) {
      // Is old section an existing one and next a temporary one? Then switch.
      downMove(previousSection.words[0].id);
      return;
    }

    if (oldSectionWords.length === 0) part.sections.splice(part.sections.indexOf(section), 1);
    else {
      section.words = oldSectionWords;
      section.section.starts_at = section.words[0].starts_at;
    }

    previousSection.words = previousSection.words.concat(section.words.filter((x) => x.starts_at < word.ends_at));
    previousSection.section.ends_at = previousSection.words[previousSection.words.length - 1].ends_at;
    previousSection.section.words_per_second =
      previousSection.words.length / (previousSection.section.ends_at - previousSection.section.starts_at);

    setPart({ part: part.part, sections: part.sections });
  };

  const wordSaveFunction = (newWord: Word) => {
    if (!part) return;

    const word = part.sections.flatMap((x) => x.words).find((x) => x.id === newWord.id);
    if (!word) {
      console.error("whoops");
      return;
    }

    word.overwrite = newWord.overwrite === word.text ? "" : newWord.overwrite;
    setPart({ part: part.part, sections: part.sections });
  };

  const episodeSpeakerSaveFunction = (sectionId: number) => {
    return (newEpisodeSpeakerId: number) => {
      if (!part) return;

      const section = part.sections.find((x) => x.section.id === sectionId);
      if (!section) {
        return;
      }

      //
      section.episode_speaker_id = newEpisodeSpeakerId;
      if (section.episode_speaker_id === episodeSpeakerId) {
        section.episode_speaker_id = undefined;
      }

      setPart({ part: part.part, sections: part.sections });
    };
  };

  const moveSection = (sectionId: number, previous: boolean) => {
    return (event: ChangeEvent<HTMLInputElement>): void => {
      if (!part) return;

      const section = part.sections.find((x) => x.section.id === sectionId);
      if (!section) {
        return;
      }

      const active = event.currentTarget.checked;

      if (previous) {
        section.move_to_previous_part = active || undefined;
        section.move_to_next_part = undefined;
      } else {
        section.move_to_previous_part = undefined;
        section.move_to_next_part = active || undefined;
      }

      setPart({ part: part.part, sections: part.sections });
    };
  };

  return part ? (
    <div className="flex-1">
      <div className="flex flex-row">
        <div className="flex-1">
          {part.sections.map((section, i) => (
            <div key={section.section.id} className="flex flex-col border-b border-gray-400">
              <div className="flex-1 flex flex-row bg-gray-100">
                <div className="w-20 text-right">{section.section.starts_at.toFixed(2)}</div>
                <div className="w-14 flex flex-row">
                  <div className="w-12 text-right">
                    {(section.section.ends_at - section.section.starts_at).toFixed(2)}
                  </div>
                  <div className="ml-0.5 flex-1">s</div>
                </div>
                <div className="w-14 flex flex-row ml-8">
                  <div className="w-12 text-right">{section.section.words_per_second.toFixed(2)}</div>
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
                    {section.words.some((x) => x.hidden) ? "show all" : "hide all"}
                  </span>
                </div>
                <div className="flex-1 ml-8">
                  <SectionSpeakerComponent
                    speakerId={section.episode_speaker_id || part.part.episode_speaker_id}
                    speakers={speakers}
                    episodeSpeakers={episodeSpeakers}
                    saveFunction={episodeSpeakerSaveFunction(section.section.id)}
                  />
                </div>
                <div className="w-28 flex-0">
                  {i === 0 ? (
                    <>
                      <input
                        type="checkbox"
                        name="move_up"
                        id={`move_up_${section.section.id}`}
                        onChange={moveSection(section.section.id, true)}
                      />
                      <label htmlFor={`move_up_${section.section.id}`}>Move up</label>
                    </>
                  ) : (
                    <></>
                  )}
                  {i === part.sections.length - 1 ? (
                    <>
                      <input
                        type="checkbox"
                        name="move_down"
                        id={`move_down_${section.section.id}`}
                        onChange={moveSection(section.section.id, false)}
                      />
                      <label htmlFor={`move_down_${section.section.id}`}>Move up</label>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-row flex-wrap mb-2">
                {section.words.map((w) => {
                  const wordColor = getWordColor(w);
                  return (
                    <div key={w.id} className={`group btn sz-sm m-1 ${wordColor}`}>
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
              <div className={`group btn sz-sm m-1 ${getWordColor(activeWord)}`}>
                <span className={activeWord.hidden ? "line-through" : ""}>
                  {activeWord.overwrite || activeWord.text}
                </span>
              </div>
              <div
                onClick={() => {
                  upMove(activeWord.id);
                }}
                onKeyDown={() => {
                  upMove(activeWord.id);
                }}
              >
                Move up to next section
              </div>
              <div
                onClick={() => {
                  upNew(activeWord.id);
                }}
                onKeyDown={() => {
                  upNew(activeWord.id);
                }}
              >
                Move up to new section
              </div>
              <div>
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
              </div>
              <div
                onClick={() => {
                  downNew(activeWord.id);
                }}
                onKeyDown={() => {
                  downNew(activeWord.id);
                }}
              >
                Move down to new section
              </div>
              <div
                onClick={() => {
                  downMove(activeWord.id);
                }}
                onKeyDown={() => {
                  downMove(activeWord.id);
                }}
              >
                Move down to next section
              </div>
            </>
          ) : (
            <p>Select a word</p>
          )}
        </div>
      </div>
      <div className="flex flex-row">
        <div className="btn variant-soft p-1" onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
          Cancel
        </div>
        <div className="btn variant-primary p-1 ml-3">Save changes</div>
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

    if (event.code !== "Enter" && event.code !== "NumpadEnter") {
      return;
    }

    word.overwrite = event.currentTarget.value;
    saveFunction(word);
    toggleShowEdit();
  };

  return showEdit ? (
    <input type="text" defaultValue={word.overwrite || word.text} onKeyDown={keyDown} className="w-20" />
  ) : (
    <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit} className={word.hidden ? "line-through" : ""}>
      {word.overwrite || word.text}
    </span>
  );
};

export interface SectionSpeakerParams {
  speakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  saveFunction: (speakerId: number) => void;
}

export const SectionSpeakerComponent = ({
  speakerId,
  speakers,
  episodeSpeakers,
  saveFunction,
}: SectionSpeakerParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  const keyDown: KeyboardEventHandler<HTMLSelectElement> = (event) => {
    if (event.code === "Escape") {
      toggleShowEdit();
      return;
    }

    if (event.code !== "Enter" && event.code !== "NumpadEnter") {
      return;
    }

    const speakerId = Number.parseInt(event.currentTarget.value);

    saveFunction(speakerId);
    toggleShowEdit();
  };

  const episodeSpeaker = episodeSpeakers.find((x) => x.id === speakerId);
  const speaker = speakers.find((x) => x.id === episodeSpeaker?.speaker_id);

  return showEdit ? (
    <select size={1} name="speaker_id" defaultValue={speakerId} onKeyDown={keyDown}>
      {episodeSpeakers.map((x) => (
        <option key={x.id} value={x.id}>
          {speakers.find((y) => y.id === x.speaker_id)?.name}
        </option>
      ))}
    </select>
  ) : (
    <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
      {speaker?.name}
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
