import { useState } from "react";
import type { Speaker, EpisodeSpeaker } from "../../definitions";
import { PartEditFormComponent } from "./PartEditForm";
import type { NewPart } from "./definitions";

interface ShowPartParams {
  episodeId: number;
  part: NewPart;
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  startAudioAt: (position: number) => void;
  curTime: number;
}

export const ShowPartComponent = ({
  part,
  episodeId,
  episodeSpeakerId,
  speakers,
  episodeSpeakers,
  startAudioAt,
  curTime,
}: ShowPartParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  return showEdit ? (
    <PartEditFormComponent
      episodeId={episodeId}
      partId={part.id}
      toggleShowEdit={toggleShowEdit}
      episodeSpeakerId={episodeSpeakerId}
      speakers={speakers}
      episodeSpeakers={episodeSpeakers}
      startAudioAt={startAudioAt}
      curTime={curTime}
    />
  ) : (
    <>
      <div className="w-20 text-right" onClick={() => startAudioAt(part.start)}>
        {part.start.toFixed(2)}
      </div>
      <div className={`flex-1 ml-2 ${curTime >= part.start && curTime < part.end ? "bg-yellow-200" : ""}`}>
        {part.text}
      </div>
      <div className="w-10 ml-2">
        <p onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
          Edit
        </p>
      </div>
    </>
  );
};
