import { useState } from "react";
import type { EpisodeSpeaker, Speaker } from "../../definitions";
import { useFetcher } from "react-router-dom";

export interface EpisodeSpeakerParams {
  episodeSpeaker: EpisodeSpeaker;
  speakers: Speaker[];
}

export const EpisodeSpeakerComponent = ({ episodeSpeaker, speakers }: EpisodeSpeakerParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  const fetcher = useFetcher();

  if (fetcher.formData && showEdit) {
    setShowEdit(false);
    episodeSpeaker.speaker_id = Number.parseInt(`${fetcher.formData.get("description")}`);
  }

  return (
    <>
      {speakers.find((y) => y.id === episodeSpeaker.speaker_id)?.name}
      {showEdit ? (
        <fetcher.Form method="post">
          <div className="flex flex-row">
            <select size={1} name="speaker_id" defaultValue={episodeSpeaker.speaker_id}>
              {speakers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="episodeSpeakerId" value={episodeSpeaker.id} />
            <button type="submit" name="function" value="editEpisodeSpeaker" className="btn variant-primary ml-3 p-1">
              Update
            </button>
            <button
              type="button"
              className="btn variant-neutral ml-3 p-1"
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
