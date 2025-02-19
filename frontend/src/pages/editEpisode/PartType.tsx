import { useState, type KeyboardEventHandler } from "react";
import { PartTypeMap } from "../../lib/lib";

export interface PartSpeakerParams {
  partType: number;
  saveFunction: (speakerId: number) => void;
}

export const PartTypeComponent = ({ partType, saveFunction }: PartSpeakerParams) => {
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

    const newPartType = Number.parseInt(event.currentTarget.value);
    saveFunction(newPartType);
    toggleShowEdit();
  };

  return showEdit ? (
    <select size={1} name="speaker_id" defaultValue={partType} onKeyDown={keyDown}>
      {PartTypeMap.map((x, i) => (
        <option key={x} value={i}>
          {x}
        </option>
      ))}
    </select>
  ) : (
    <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
      {PartTypeMap[partType]}
    </span>
  );
};
