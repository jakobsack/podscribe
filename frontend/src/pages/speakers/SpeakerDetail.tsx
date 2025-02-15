import { useState } from "react";
import { Link, useFetcher } from "react-router-dom";
import type { Speaker } from "../../definitions";
import Markdown from "react-markdown";

interface SpeakerDetailParams {
  speaker: Speaker;
}

export type ViewMode = "inline" | "expand" | "form";

export const SpeakerDetailComponent = ({ speaker }: SpeakerDetailParams) => {
  const [mode, setMode] = useState<ViewMode>("inline");

  const toggleExpand = () => {
    setMode(mode === "expand" ? "inline" : "expand");
  };

  const toggleShowEdit = () => {
    setMode(mode === "form" ? "expand" : "form");
  };

  const fetcher = useFetcher();

  if (fetcher.formData && mode === "form") {
    setMode("expand");
    speaker.name = `${fetcher.formData.get("name")}`;
    speaker.description = `${fetcher.formData.get("description")}`;
  }

  if (mode === "inline") {
    return (
      <div className="flex flex-row w-full">
        <div className="w-40">{speaker.name}</div>
        <div className="flex-1 truncate">{(speaker.description || "").split("\n")[0]}</div>
        <div className="w-20">
          <button type="button" onClick={toggleExpand} onKeyDown={toggleExpand} className="btn variant-ghost p-1">
            Expand
          </button>
        </div>
      </div>
    );
  }

  if (mode === "expand") {
    return (
      <div className="flex flex-row w-full">
        <div className="w-40">{speaker.name}</div>
        <div className="flex-1">
          <Markdown>{speaker.description}</Markdown>
        </div>
        <div className="w-20">
          <button type="button" onClick={toggleShowEdit} onKeyDown={toggleShowEdit} className="btn variant-ghost p-1">
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <fetcher.Form method="post" action={`${speaker.id}/edit`} className=" w-full">
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
              className="input variant-outlined border border-gray-300 p-1"
              placeholder="Name"
              defaultValue={speaker.name}
            />
          </div>
        </div>
        <div className="flex flex-row pt-2">
          <div className="w-40">
            <label htmlFor="formDescription">Description</label>
          </div>
          <div className="flex-1">
            <textarea
              className="textarea variant-outlined border border-gray-300 p-1 h-48"
              name="description"
              id="formDescription"
              placeholder="Description (optional)"
              defaultValue={speaker.description}
            />
          </div>
        </div>
        <div className="flex flex-row pt-2">
          <div className="w-40" />
          <button type="submit" className="btn variant-primary p-1">
            Update
          </button>
          <button
            type="button"
            className="btn variant-soft p-1 ml-5"
            onClick={toggleShowEdit}
            onKeyDown={toggleShowEdit}
          >
            Cancel
          </button>
        </div>
      </div>
    </fetcher.Form>
  );
};
