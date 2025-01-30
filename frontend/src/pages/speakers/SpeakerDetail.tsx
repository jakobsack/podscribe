import { useState } from "react";
import { useFetcher } from "react-router-dom";
import type { Speaker } from "../../definitions";

interface SpeakerDetailParams {
  speaker: Speaker;
}

export const SpeakerDetailComponent = ({ speaker }: SpeakerDetailParams) => {
  const [showEdit, setShowEdit] = useState(false);

  const toggleShowEdit = () => {
    setShowEdit(!showEdit);
  };

  const fetcher = useFetcher();

  if (fetcher.formData && showEdit) {
    setShowEdit(false);
    speaker.name = `${fetcher.formData.get("name")}`;
    speaker.description = `${fetcher.formData.get("description")}`;
  }

  return (
    <>
      {showEdit ? (
        <fetcher.Form method="post" action={`${speaker.id}/edit`}>
          <div className="flex flex-col">
            <div className="flex flex-row">
              <div className="w-40">
                <label htmlFor="formName">Name</label>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="name"
                  id="formName"
                  className="border border-gray-300"
                  placeholder="Name"
                  defaultValue={speaker.name}
                />
              </div>
            </div>
            <div className="flex flex-row pt-2">
              <div className="w-40">
                <label htmlFor="formDescription">Description</label>
              </div>
              <textarea
                className="border border-gray-300"
                name="description"
                id="formDescription"
                placeholder="Description (optional)"
                defaultValue={speaker.description}
              />
            </div>
            <div className="flex flex-row pt-2">
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
          </div>
        </fetcher.Form>
      ) : (
        <>
          <p>
            {speaker.name} - {speaker.description || " "}
          </p>
          <p onClick={toggleShowEdit} onKeyDown={toggleShowEdit}>
            Edit
          </p>
        </>
      )}
    </>
  );
};
