import { useState, type KeyboardEventHandler } from "react";
import type { Word } from "../../definitions";

export interface WordFormParams {
  word: Word;
  saveFunction: (word: Word) => void;
}

export const WordFormComponent = ({ word, saveFunction }: WordFormParams) => {
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
    <input
      type="text"
      defaultValue={word.overwrite || word.text}
      onKeyDown={keyDown}
      className="w-20 bg-white text-black"
    />
  ) : (
    <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit} className={word.hidden ? "line-through" : ""}>
      {word.overwrite || word.text}
    </span>
  );
};
