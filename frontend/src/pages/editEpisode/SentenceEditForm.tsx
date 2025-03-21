import { Timestamp } from "../../common/Timestamp";
import type { SentenceDisplay, Word } from "../../definitions";
import { getWordColor } from "./getWordColor";
import { WordFormComponent } from "./WordForm";

interface SentenceEditFormParams {
  sentence: SentenceDisplay;
  toggleSentenceHidden: (id: number) => void;
  moveSentence: (sentenceId: number, direction: "up" | "upnew" | "downnew" | "down" | "") => () => void;
  wordSaveFunction: (newWord: Word) => void;
  setActiveWord: React.Dispatch<React.SetStateAction<Word | undefined>>;
  isFirst?: boolean;
  isLast?: boolean;
  startAudioAt: (position: number) => void;
  curTime: number;
}

export function SentenceEditFormComponent({
  sentence,
  toggleSentenceHidden,
  moveSentence,
  wordSaveFunction,
  setActiveWord,
  isFirst,
  isLast,
  startAudioAt,
  curTime,
}: SentenceEditFormParams) {
  return (
    <div className="flex flex-1 flex-col border-gray-400 border-b dark:border-gray-500">
      <div className="flex flex-1 flex-row bg-gray-100 dark:bg-gray-800">
        <div
          className="w-20 text-right"
          onClick={() => {
            startAudioAt(sentence.sentence.starts_at);
          }}
        >
          <Timestamp seconds={sentence.sentence.starts_at} includeHundredth={true} />
        </div>
        <div className="flex w-14 flex-row">
          <div className="w-12 text-right">{(sentence.sentence.ends_at - sentence.sentence.starts_at).toFixed(2)}</div>
          <div className="ml-0.5 flex-1">s</div>
        </div>
        <div className="ml-8 flex w-14 flex-row">
          <div className="w-12 text-right">{sentence.sentence.words_per_second.toFixed(2)}</div>
          <div className="ml-0.5 flex-1">wps</div>
        </div>
        <div className="ml-8 flex-1">
          <span
            onClick={() => {
              toggleSentenceHidden(sentence.sentence.id);
            }}
            onKeyDown={() => {
              toggleSentenceHidden(sentence.sentence.id);
            }}
          >
            {sentence.words.some((x) => x.hidden) ? "show all" : "hide all"}
          </span>
        </div>
        <div className="w-48 flex-0">
          {isFirst &&
            (sentence.move_sentence === "up" ? (
              <span onClick={moveSentence(sentence.sentence.id, "")} onKeyDown={moveSentence(sentence.sentence.id, "")}>
                Undo move
              </span>
            ) : (
              <span
                onClick={moveSentence(sentence.sentence.id, "up")}
                onKeyDown={moveSentence(sentence.sentence.id, "up")}
              >
                Append above
              </span>
            ))}
          {isFirst && isLast && <br />}
          {isLast &&
            (sentence.move_sentence === "down" ? (
              <span onClick={moveSentence(sentence.sentence.id, "")} onKeyDown={moveSentence(sentence.sentence.id, "")}>
                Undo move
              </span>
            ) : (
              <span
                onClick={moveSentence(sentence.sentence.id, "down")}
                onKeyDown={moveSentence(sentence.sentence.id, "down")}
              >
                Prepend below
              </span>
            ))}
        </div>
        <div className="w-48 flex-0">
          {isFirst &&
            (sentence.move_sentence === "upnew" ? (
              <span onClick={moveSentence(sentence.sentence.id, "")} onKeyDown={moveSentence(sentence.sentence.id, "")}>
                Undo move
              </span>
            ) : (
              <span
                onClick={moveSentence(sentence.sentence.id, "upnew")}
                onKeyDown={moveSentence(sentence.sentence.id, "upnew")}
              >
                Move up
              </span>
            ))}
          {isFirst && isLast && <br />}
          {isLast &&
            (sentence.move_sentence === "downnew" ? (
              <span onClick={moveSentence(sentence.sentence.id, "")} onKeyDown={moveSentence(sentence.sentence.id, "")}>
                Undo move
              </span>
            ) : (
              <span
                onClick={moveSentence(sentence.sentence.id, "downnew")}
                onKeyDown={moveSentence(sentence.sentence.id, "downnew")}
              >
                Move down
              </span>
            ))}
        </div>
      </div>
      <div
        className={`mb-2 flex flex-1 flex-row flex-wrap ${curTime >= sentence.sentence.starts_at && curTime < sentence.sentence.ends_at ? "bg-sky-200 dark:bg-sky-700" : ""}`}
      >
        {sentence.words.map((w) => {
          const wordColor = getWordColor(w);
          return (
            <div key={w.id} className={`group btn sz-sm m-1 ${wordColor}`}>
              <WordFormComponent word={w} saveFunction={wordSaveFunction} />
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                width="2em"
                height="2em"
                viewBox="0 0 479.79 479.79"
                className="w-3 border-l pl-1"
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
  );
}
