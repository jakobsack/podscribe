import { useState, useEffect } from "react";
import { Form } from "react-router-dom";
import type { Speaker, EpisodeSpeaker, PartDisplay, Word, SentenceDisplay, PartType } from "../../definitions";
import { getWordColor } from "./getWordColor";
import { PartSpeakerComponent } from "./PartSpeaker";
import { SentenceEditFormComponent } from "./SentenceEditForm";
import { jwtFetch } from "../../common/jwtFetch";
import { PartTypeComponent } from "./PartType";

interface PartEditFormParams {
  episodeId: number;
  partId: number;
  toggleShowEdit: () => void;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  startAudioAt: (position: number) => void;
  curTime: number;
}

export const PartEditFormComponent = ({
  episodeId,
  partId,
  toggleShowEdit,
  speakers,
  episodeSpeakers,
  startAudioAt,
  curTime,
}: PartEditFormParams) => {
  const [part, setPart] = useState<PartDisplay | undefined>(undefined);
  const [originalPart, setOriginalPart] = useState<PartDisplay | undefined>(undefined);

  const [activeWord, setActiveWord] = useState<Word | undefined>(undefined);

  useEffect(() => {
    jwtFetch(`/api/episodes/${episodeId}/parts/${partId}/display`)
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

    const word = part.sentences.flatMap((x) => x.words).find((x) => x.id === id);
    if (!word) {
      console.error("whoops");
      return;
    }

    word.hidden = !word.hidden;
    setPart({ part: part.part, sentences: part.sentences });
    setActiveWord(word);
  };

  // -------------------------------------------------------------------
  // Toggle Sentence
  const toggleSentenceHidden = (id: number) => {
    if (!part) return;

    const words = part.sentences.find((x) => x.sentence.id === id)?.words;
    if (!words) {
      console.error("whoops");
      return;
    }

    const hideRest = words.some((x) => !x.hidden);
    for (const word of words.filter((x) => x.hidden !== hideRest)) {
      word.hidden = hideRest;
    }

    setPart({ part: part.part, sentences: part.sentences });
  };

  // -------------------------------------------------------------------
  // Move words to another sentence
  const moveWords = (id: number, direction: "up" | "down", create: boolean) => {
    return () => {
      if (!part) return;

      const sourceSentence = part.sentences.find((x) => x.words.some((y) => y.id === id));
      if (!sourceSentence) {
        console.error(`Cannot find sentence with word with id ${id}`);
        return;
      }

      const word = sourceSentence.words.find((x) => x.id === id);
      if (!word) {
        console.error(`Cannot find word with id ${id}`);
        return;
      }

      let movedWords: Word[];
      let keptWords: Word[];
      if (direction === "up") {
        movedWords = sourceSentence.words.filter((x) => x.starts_at < word.ends_at);
        keptWords = sourceSentence.words.filter((x) => x.starts_at > word.starts_at);
      } else {
        movedWords = sourceSentence.words.filter((x) => x.ends_at > word.starts_at);
        keptWords = sourceSentence.words.filter((x) => x.starts_at < word.starts_at);
      }

      let targetSentence: SentenceDisplay;
      if (direction === "up" && create) {
        if (keptWords.length === 0) {
          console.log("Not creating new up sentence as existing sentence would be empty");
          return;
        }

        const newSentenceId = Math.min(0, ...part.sentences.map((x) => x.sentence.id)) - 1;

        targetSentence = {
          sentence: {
            starts_at: 0,
            ends_at: 0,
            id: newSentenceId,
            text: "",
            words_per_second: 0,
          },
          words: movedWords,
        };

        sourceSentence.words = keptWords;

        part.sentences.splice(part.sentences.indexOf(sourceSentence), 0, targetSentence);
      } else if (direction === "up") {
        targetSentence = part.sentences[part.sentences.indexOf(sourceSentence) - 1];
        if (!targetSentence) {
          console.log("Unable to find previous target sentence");
          return;
        }

        if (keptWords.length === 0 && sourceSentence.sentence.id > 0 && targetSentence.sentence.id < 0) {
          // Is old sentence an existing one and next a temporary one? Then switch.
          moveWords(targetSentence.words[0].id, "down", false)();
          return;
        }

        if (keptWords.length === 0) {
          part.sentences.splice(part.sentences.indexOf(sourceSentence), 1);
        } else {
          sourceSentence.words = keptWords;
        }

        targetSentence.words = targetSentence.words.concat(movedWords);
      } else if (create) {
        if (keptWords.length === 0) {
          console.log("Not creating new down sentence as existing sentence would be empty");
          return;
        }

        const newSentenceId = Math.min(0, ...part.sentences.map((x) => x.sentence.id)) - 1;

        targetSentence = {
          sentence: {
            starts_at: 0,
            ends_at: 0,
            id: newSentenceId,
            text: "",
            words_per_second: 0,
          },
          words: movedWords,
        };

        sourceSentence.words = keptWords;

        part.sentences.splice(part.sentences.indexOf(sourceSentence) + 1, 0, targetSentence);
      } else {
        targetSentence = part.sentences[part.sentences.indexOf(sourceSentence) + 1];
        if (!targetSentence) {
          console.log("Unable to find next target sentence");
          return;
        }

        if (keptWords.length === 0 && sourceSentence.sentence.id > 0 && targetSentence.sentence.id < 0) {
          // Is old sentence an existing one and next a temporary one? Then switch.
          moveWords(targetSentence.words[targetSentence.words.length - 1].id, "up", false)();
          return;
        }

        if (keptWords.length === 0) part.sentences.splice(part.sentences.indexOf(sourceSentence), 1);
        else {
          sourceSentence.words = keptWords;
        }

        targetSentence.words = movedWords.concat(targetSentence.words);
      }

      targetSentence.sentence.starts_at = targetSentence.words[0].starts_at;
      targetSentence.sentence.ends_at = targetSentence.words[targetSentence.words.length - 1].ends_at;
      targetSentence.sentence.words_per_second =
        targetSentence.words.length / (targetSentence.sentence.ends_at - targetSentence.sentence.starts_at);

      sourceSentence.sentence.starts_at = sourceSentence.words[0].starts_at;
      sourceSentence.sentence.ends_at = sourceSentence.words[sourceSentence.words.length - 1].ends_at;
      sourceSentence.sentence.words_per_second =
        sourceSentence.words.length / (sourceSentence.sentence.ends_at - sourceSentence.sentence.starts_at);

      setPart({ part: part.part, sentences: part.sentences });
    };
  };

  // -------------------------------------------------------------------
  // Change a word
  const wordSaveFunction = (newWord: Word) => {
    if (!part) return;

    const word = part.sentences.flatMap((x) => x.words).find((x) => x.id === newWord.id);
    if (!word) {
      console.error("whoops");
      return;
    }

    word.overwrite = newWord.overwrite === word.text ? "" : newWord.overwrite;
    setPart({ part: part.part, sentences: part.sentences });
  };

  // -------------------------------------------------------------------
  // Change speaker of part
  const episodeSpeakerSaveFunction = (newEpisodeSpeakerId: number) => {
    if (!part) return;

    part.part.episode_speaker_id = newEpisodeSpeakerId;

    setPart({ part: part.part, sentences: part.sentences });
  };

  // -------------------------------------------------------------------
  // Change part type
  const partTypeSaveFunction = (newPartType: PartType) => {
    if (!part) return;

    part.part.part_type = newPartType;

    setPart({ part: part.part, sentences: part.sentences });
  };

  // -------------------------------------------------------------------
  // Move a sentence
  const moveSentence = (sentenceId: number, direction: "up" | "upnew" | "downnew" | "down" | "") => {
    return (): void => {
      if (!part) return;

      const sentence = part.sentences.find((x) => x.sentence.id === sentenceId);
      if (!sentence) {
        return;
      }

      if (direction) {
        sentence.move_sentence = direction;
      } else {
        sentence.move_sentence = undefined;
      }

      setPart({ part: part.part, sentences: part.sentences });
    };
  };

  if (!part) {
    return <p>Loading</p>;
  }

  return (
    <div className="flex-1">
      <div className="flex flex-row">
        <div className="flex-1">
          {!!part.sentences.length && part.sentences[0].move_sentence?.startsWith("up") && (
            <div className="flex flex-row">
              <div className="bg-purple-600 w-4" />
              <SentenceEditFormComponent
                key={part.sentences[0].sentence.id}
                sentence={part.sentences[0]}
                toggleSentenceHidden={toggleSentenceHidden}
                moveSentence={moveSentence}
                wordSaveFunction={wordSaveFunction}
                setActiveWord={setActiveWord}
                isFirst={true}
                isLast={part.sentences.length === 1}
                startAudioAt={startAudioAt}
                curTime={curTime}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="bg-purple-200 flex-1">
              <div className="flex-1 ml-4 flex flex-row">
                <div>
                  <PartSpeakerComponent
                    speakerId={part.part.episode_speaker_id}
                    speakers={speakers}
                    episodeSpeakers={episodeSpeakers}
                    saveFunction={episodeSpeakerSaveFunction}
                  />
                </div>
                <div className="ml-8">
                  <PartTypeComponent partType={part.part.part_type} saveFunction={partTypeSaveFunction} />
                </div>
              </div>
            </div>
            {part.sentences
              .filter((x) => !x.move_sentence)
              .map((sentence, i) => {
                return (
                  <div key={sentence.sentence.id} className="flex flex-row">
                    <div className="bg-purple-200 w-4" />
                    <SentenceEditFormComponent
                      sentence={sentence}
                      toggleSentenceHidden={toggleSentenceHidden}
                      moveSentence={moveSentence}
                      wordSaveFunction={wordSaveFunction}
                      setActiveWord={setActiveWord}
                      isFirst={part.sentences[0].sentence.id === sentence.sentence.id}
                      isLast={part.sentences[part.sentences.length - 1].sentence.id === sentence.sentence.id}
                      startAudioAt={startAudioAt}
                      curTime={curTime}
                    />
                  </div>
                );
              })}
          </div>
          {!!part.sentences.length && part.sentences[part.sentences.length - 1].move_sentence?.startsWith("down") && (
            <div className="flex flex-row">
              <div className="bg-purple-600 w-4" />
              <SentenceEditFormComponent
                key={part.sentences[part.sentences.length - 1].sentence.id}
                sentence={part.sentences[part.sentences.length - 1]}
                toggleSentenceHidden={toggleSentenceHidden}
                moveSentence={moveSentence}
                wordSaveFunction={wordSaveFunction}
                setActiveWord={setActiveWord}
                isFirst={part.sentences.length === 1}
                isLast={true}
                startAudioAt={startAudioAt}
                curTime={curTime}
              />
            </div>
          )}
        </div>
        <div className="w-60 border-b border-l border-gray-400 bg-slate-100 flex flex-col text-center">
          <strong className="text-center mb-4">Info</strong>
          {activeWord ? (
            <>
              {/* Word and maybe original word */}
              <div className={`group btn sz-sm m-1 ${getWordColor(activeWord)}`}>
                <span className={activeWord.hidden ? "line-through" : ""}>
                  {activeWord.overwrite || activeWord.text}
                </span>
              </div>
              {activeWord.overwrite && (
                <>
                  <i>Original:</i>{" "}
                  <div className={`group btn sz-sm m-1 ${getWordColor(activeWord, true)}`}>
                    <span className={activeWord.hidden ? "line-through" : ""}>{activeWord.text}</span>
                  </div>
                </>
              )}

              {/* Move and hide */}
              <div
                onClick={moveWords(activeWord.id, "up", false)}
                onKeyDown={moveWords(activeWord.id, "up", false)}
                className="mt-4"
              >
                Move up to previous sentence
              </div>
              <div onClick={moveWords(activeWord.id, "up", true)} onKeyDown={moveWords(activeWord.id, "up", true)}>
                Move up to new sentence
              </div>
              <div className="mt-4 mb-4">
                <span
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
                Move down to new sentence
              </div>
              <div
                onClick={moveWords(activeWord.id, "down", false)}
                onKeyDown={moveWords(activeWord.id, "down", false)}
              >
                Move down to next sentence
              </div>
            </>
          ) : (
            <p>Select a word</p>
          )}
        </div>
      </div>
      <Form method="post">
        <div className="flex flex-row">
          <textarea id="json" name="json" className="hidden" readOnly={true} value={JSON.stringify(part)} />
          <input type="hidden" name="partId" value={part.part.id} />
          <div className="btn variant-neutral p-1" onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
            Cancel
          </div>
          <button type="submit" name="function" value="editPart" className="btn variant-primary p-1 ml-3">
            Update
          </button>
        </div>
      </Form>
    </div>
  );
};
