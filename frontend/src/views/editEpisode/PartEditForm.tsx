import { useState, useEffect, type ChangeEvent } from "react";
import { useFetcher } from "react-router-dom";
import type { Speaker, EpisodeSpeaker, PartDisplay, Word, SectionDisplay } from "../../definitions";
import { getWordColor } from "./getWordColor";
import { PartSpeakerComponent } from "./PartSpeaker";
import { SectionEditFormComponent } from "./SectionEditForm";

interface PartEditFormParams {
  episodeId: number;
  partId: number;
  toggleShowEdit: () => void;
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

export const PartEditFormComponent = ({
  episodeId,
  partId,
  toggleShowEdit,
  episodeSpeakerId,
  speakers,
  episodeSpeakers,
}: PartEditFormParams) => {
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

  // -------------------------------------------------------------------
  // Toggle Word
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

  // -------------------------------------------------------------------
  // Toggle Section
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

  // -------------------------------------------------------------------
  // Move words to another section
  const moveWords = (id: number, direction: "up" | "down", create: boolean) => {
    return () => {
      if (!part) return;

      const sourceSection = part.sections.find((x) => x.words.some((y) => y.id === id));
      if (!sourceSection) {
        console.error(`Cannot find section with word with id ${id}`);
        return;
      }

      const word = sourceSection.words.find((x) => x.id === id);
      if (!word) {
        console.error(`Cannot find word with id ${id}`);
        return;
      }

      let movedWords: Word[];
      let keptWords: Word[];
      if (direction === "up") {
        movedWords = sourceSection.words.filter((x) => x.starts_at < word.ends_at);
        keptWords = sourceSection.words.filter((x) => x.starts_at > word.starts_at);
      } else {
        movedWords = sourceSection.words.filter((x) => x.ends_at > word.starts_at);
        keptWords = sourceSection.words.filter((x) => x.starts_at < word.starts_at);
      }

      let targetSection: SectionDisplay;
      if (direction === "up" && create) {
        if (keptWords.length === 0) {
          console.log("Not creating new up section as existing section would be empty");
          return;
        }

        const newSectionId = Math.min(0, ...part.sections.map((x) => x.section.id)) - 1;

        targetSection = {
          section: {
            corrected: false,
            starts_at: 0,
            ends_at: 0,
            id: newSectionId,
            text: "",
            words_per_second: 0,
          },
          words: movedWords,
        };

        sourceSection.words = keptWords;

        part.sections.splice(part.sections.indexOf(sourceSection), 0, targetSection);
      } else if (direction === "up") {
        targetSection = part.sections[part.sections.indexOf(sourceSection) - 1];
        if (!targetSection) {
          console.log("Unable to find previous target section");
          return;
        }

        if (keptWords.length === 0 && sourceSection.section.id > 0 && targetSection.section.id < 0) {
          // Is old section an existing one and next a temporary one? Then switch.
          moveWords(targetSection.words[0].id, "down", false)();
          return;
        }

        if (keptWords.length === 0) {
          part.sections.splice(part.sections.indexOf(sourceSection), 1);
        } else {
          sourceSection.words = keptWords;
        }

        targetSection.words = targetSection.words.concat(movedWords);
      } else if (create) {
        if (keptWords.length === 0) {
          console.log("Not creating new down section as existing section would be empty");
          return;
        }

        const newSectionId = Math.min(0, ...part.sections.map((x) => x.section.id)) - 1;

        targetSection = {
          section: {
            corrected: false,
            starts_at: 0,
            ends_at: 0,
            id: newSectionId,
            text: "",
            words_per_second: 0,
          },
          words: movedWords,
        };

        sourceSection.words = keptWords;

        part.sections.splice(part.sections.indexOf(sourceSection) + 1, 0, targetSection);
      } else {
        targetSection = part.sections[part.sections.indexOf(sourceSection) + 1];
        if (!targetSection) {
          console.log("Unable to find next target section");
          return;
        }

        if (keptWords.length === 0 && sourceSection.section.id > 0 && targetSection.section.id < 0) {
          // Is old section an existing one and next a temporary one? Then switch.
          moveWords(targetSection.words[targetSection.words.length - 1].id, "up", false)();
          return;
        }

        if (keptWords.length === 0) part.sections.splice(part.sections.indexOf(sourceSection), 1);
        else {
          sourceSection.words = keptWords;
        }

        targetSection.words = movedWords.concat(targetSection.words);
      }

      targetSection.section.starts_at = targetSection.words[0].starts_at;
      targetSection.section.ends_at = targetSection.words[targetSection.words.length - 1].ends_at;
      targetSection.section.words_per_second =
        targetSection.words.length / (targetSection.section.ends_at - targetSection.section.starts_at);

      sourceSection.section.starts_at = sourceSection.words[0].starts_at;
      sourceSection.section.ends_at = sourceSection.words[sourceSection.words.length - 1].ends_at;
      sourceSection.section.words_per_second =
        sourceSection.words.length / (sourceSection.section.ends_at - sourceSection.section.starts_at);

      setPart({ part: part.part, sections: part.sections });
    };
  };

  // -------------------------------------------------------------------
  // Change a word
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

  // -------------------------------------------------------------------
  // Change speaker of part
  const episodeSpeakerSaveFunction = (newEpisodeSpeakerId: number) => {
    if (!part) return;

    part.part.episode_speaker_id = newEpisodeSpeakerId;

    setPart({ part: part.part, sections: part.sections });
  };

  // -------------------------------------------------------------------
  // Move a section
  const moveSection = (sectionId: number, direction: "up" | "upnew" | "downnew" | "down" | "") => {
    return (): void => {
      if (!part) return;

      const section = part.sections.find((x) => x.section.id === sectionId);
      if (!section) {
        return;
      }

      if (direction) {
        section.move_section = direction;
      } else {
        section.move_section = undefined;
      }

      setPart({ part: part.part, sections: part.sections });
    };
  };

  const fetcher = useFetcher();

  if (!part) {
    return <p>Loading</p>;
  }

  return (
    <div className="flex-1">
      <div className="flex flex-row">
        <div className="flex-1">
          {part.sections.length && part.sections[0].move_section?.startsWith("up") ? (
            <div className="flex flex-row">
              <div className="bg-purple-600 w-4" />
              <SectionEditFormComponent
                key={part.sections[0].section.id}
                section={part.sections[0]}
                toggleSectionHidden={toggleSectionHidden}
                moveSection={moveSection}
                wordSaveFunction={wordSaveFunction}
                setActiveWord={setActiveWord}
                isFirst={true}
                isLast={part.sections.length === 1}
              />
            </div>
          ) : (
            <></>
          )}
          <div className="flex-1">
            <div className="bg-purple-200 flex-1">
              <div className="flex-1 ml-4">
                <PartSpeakerComponent
                  speakerId={part.part.episode_speaker_id}
                  speakers={speakers}
                  episodeSpeakers={episodeSpeakers}
                  saveFunction={episodeSpeakerSaveFunction}
                />
              </div>
            </div>
            {part.sections
              .filter((x) => !x.move_section)
              .map((section, i) => {
                return (
                  <div key={section.section.id} className="flex flex-row">
                    <div className="bg-purple-200 w-4" />
                    <SectionEditFormComponent
                      section={section}
                      toggleSectionHidden={toggleSectionHidden}
                      moveSection={moveSection}
                      wordSaveFunction={wordSaveFunction}
                      setActiveWord={setActiveWord}
                      isFirst={part.sections[0].section.id === section.section.id}
                      isLast={part.sections[part.sections.length - 1].section.id === section.section.id}
                    />
                  </div>
                );
              })}
          </div>
          {part.sections.length && part.sections[part.sections.length - 1].move_section?.startsWith("down") ? (
            <div className="flex flex-row">
              <div className="bg-purple-600 w-4" />
              <SectionEditFormComponent
                key={part.sections[part.sections.length - 1].section.id}
                section={part.sections[part.sections.length - 1]}
                toggleSectionHidden={toggleSectionHidden}
                moveSection={moveSection}
                wordSaveFunction={wordSaveFunction}
                setActiveWord={setActiveWord}
                isFirst={part.sections.length === 1}
                isLast={true}
              />
            </div>
          ) : (
            <></>
          )}
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
              <div onClick={moveWords(activeWord.id, "up", false)} onKeyDown={moveWords(activeWord.id, "up", false)}>
                Move up to next section
              </div>
              <div onClick={moveWords(activeWord.id, "up", true)} onKeyDown={moveWords(activeWord.id, "up", true)}>
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
              <div onClick={moveWords(activeWord.id, "down", true)} onKeyDown={moveWords(activeWord.id, "down", true)}>
                Move down to new section
              </div>
              <div
                onClick={moveWords(activeWord.id, "down", false)}
                onKeyDown={moveWords(activeWord.id, "down", false)}
              >
                Move down to next section
              </div>
            </>
          ) : (
            <p>Select a word</p>
          )}
        </div>
      </div>
      <fetcher.Form method="post" action={`parts/${part.part.id}/update`}>
        <div className="flex flex-row">
          <textarea id="json" name="json" className="hidden" readOnly={true} value={JSON.stringify(part)} />
          <div className="btn variant-soft p-1" onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
            Cancel
          </div>
          <button type="submit" name="update" className="btn bg-primary-500 text-white p-1 ml-3">
            Update
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
};
