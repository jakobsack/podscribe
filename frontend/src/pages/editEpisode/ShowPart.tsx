import { useEffect, useState } from "react";
import type { Speaker, EpisodeSpeaker } from "../../definitions";
import { PartEditFormComponent } from "./PartEditForm";
import type { NewPart } from "./definitions";
import { Timestamp } from "../../common/Timestamp";
import { useRevalidator } from "react-router-dom";
import { SentenceBreaker } from "../../common/SentenceBreaker";

interface ShowPartParams {
  episodeId: number;
  part: NewPart;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  startAudioAt: (position: number) => void;
  curTime: number;
}

export const ShowPartComponent = ({
  part,
  episodeId,
  speakers,
  episodeSpeakers,
  startAudioAt,
  curTime,
}: ShowPartParams) => {
  const [updatedAt, setUpdatedAt] = useState(part.updated_at);
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  useEffect(() => {
    if (part.updated_at !== updatedAt) {
      setShowEdit(false);
      setUpdatedAt(part.updated_at);
    }
  }, [updatedAt, part]);

  return showEdit ? (
    <PartEditFormComponent
      episodeId={episodeId}
      partId={part.id}
      toggleShowEdit={toggleShowEdit}
      speakers={speakers}
      episodeSpeakers={episodeSpeakers}
      startAudioAt={startAudioAt}
      curTime={curTime}
    />
  ) : (
    <>
      <div className="w-20 text-right" onClick={() => startAudioAt(part.start)}>
        <Timestamp seconds={part.start} />
      </div>
      <div className={`ml-2 flex-1 ${curTime >= part.start && curTime < part.end ? "bg-sky-200 dark:bg-sky-700" : ""}`}>
        <SentenceBreaker text={part.text} />
      </div>
      <div className="ml-2 flex w-20 flex-row">
        <svg
          fill="currentColor"
          width="1.6em"
          height="1.45em"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          onClick={toggleShowEdit}
          onKeyDown={toggleShowEdit}
          className="hover:link"
        >
          <title>Edit</title>
          <g>
            <path d="M17.0671 2.27157C17.5 2.09228 17.9639 2 18.4324 2C18.9009 2 19.3648 2.09228 19.7977 2.27157C20.2305 2.45086 20.6238 2.71365 20.9551 3.04493C21.2864 3.37621 21.5492 3.7695 21.7285 4.20235C21.9077 4.63519 22 5.09911 22 5.56761C22 6.03611 21.9077 6.50003 21.7285 6.93288C21.5492 7.36572 21.2864 7.75901 20.9551 8.09029L20.4369 8.60845L15.3916 3.56308L15.9097 3.04493C16.241 2.71365 16.6343 2.45086 17.0671 2.27157Z" />
            <path d="M13.9774 4.9773L3.6546 15.3001C3.53154 15.4231 3.44273 15.5762 3.39694 15.7441L2.03526 20.7369C1.94084 21.0831 2.03917 21.4534 2.29292 21.7071C2.54667 21.9609 2.91693 22.0592 3.26314 21.9648L8.25597 20.6031C8.42387 20.5573 8.57691 20.4685 8.69996 20.3454L19.0227 10.0227L13.9774 4.9773Z" />
          </g>
        </svg>
        <svg
          fill="currentColor"
          className="ml-2"
          width="1.6em"
          height="1.45em"
          viewBox="0 0 512 512"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Approve</title>
          <g>
            <path d="M256,43.5C138.64,43.5,43.5,138.64,43.5,256S138.64,468.5,256,468.5S468.5,373.36,468.5,256 S373.36,43.5,256,43.5z M378.81,222.92L249.88,351.86c-7.95,7.95-18.52,12.33-29.76,12.33s-21.81-4.38-29.76-12.33l-57.17-57.17 c-8.3-8.3-12.87-19.35-12.87-31.11s4.57-22.81,12.87-31.11c8.31-8.31,19.36-12.89,31.11-12.89s22.8,4.58,31.11,12.89l24.71,24.7 l96.47-96.47c8.31-8.31,19.36-12.89,31.11-12.89c11.75,0,22.8,4.58,31.11,12.89c8.3,8.3,12.87,19.35,12.87,31.11 S387.11,214.62,378.81,222.92z" />
          </g>
        </svg>
      </div>
    </>
  );
};
