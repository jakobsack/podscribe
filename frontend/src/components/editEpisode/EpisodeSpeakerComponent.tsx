import { useState } from "react";
import type { EpisodeSpeaker, Speaker } from "../../definitions";
import { useFetcher } from "react-router-dom";

export interface EpisodeSpeakerParams {
  episodeSpeaker: EpisodeSpeaker;
  speakers: Speaker[];
}

export const EpisodeSpeakerComponent = ({
  episodeSpeaker,
  speakers,
}: EpisodeSpeakerParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  const fetcher = useFetcher();

  if (fetcher.formData && showEdit) {
    setShowEdit(false);
    episodeSpeaker.speaker_id = Number.parseInt(
      `${fetcher.formData.get("description")}`,
    );
  }

  return (
    <>
      {speakers.find((y) => y.id === episodeSpeaker.speaker_id)?.name}
      {showEdit ? (
        <fetcher.Form
          method="post"
          action={`episodeSpeakers/${episodeSpeaker.id}`}
        >
          <div className="flex flex-row">
            <select
              size={1}
              name="speaker_id"
              defaultValue={episodeSpeaker.speaker_id}
            >
              {speakers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn bg-primary-500 text-white p-1">
              Update
            </button>
            <button
              type="button"
              className="btn bg-slate-500 text-white p-1 ml-3"
              onClick={toggleShowEdit}
              onKeyDown={toggleShowEdit}
            >
              Cancel
            </button>
          </div>
        </fetcher.Form>
      ) : (
        <>
          <span onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
            Change
          </span>
        </>
      )}
    </>
  );
};
