import { useState, type KeyboardEventHandler } from "react";
import type { Speaker, EpisodeSpeaker } from "../../definitions";

export interface PartSpeakerParams {
  speakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  saveFunction: (speakerId: number) => void;
}

export const PartSpeakerComponent = ({ speakerId, speakers, episodeSpeakers, saveFunction }: PartSpeakerParams) => {
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
