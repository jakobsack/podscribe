import { useEffect, useState } from "react";
import type { Speaker } from "../../definitions";

import { Form, useActionData, useLoaderData } from "react-router-dom";
import type { ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { SpeakerDetailComponent } from "./SpeakerDetail";
import { jwtFetch } from "../../common/jwtFetch";

export const speakersLoader = (async (_args: LoaderFunctionArgs) => {
  const response = await jwtFetch("/api/speakers");
  const result = (await response.json()) as Speaker[];
  const filtered = result.filter((x) => !x.name.startsWith("SPEAKER_"));
  return { speakers: filtered };
}) satisfies LoaderFunction;

export const speakersAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();
  const update = Object.fromEntries(formData as unknown as Iterable<[PropertyKey, string]>);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = JSON.stringify(update);
  const req = await jwtFetch("/api/speakers", { method: "POST", headers, body });
  return await req.json();
}) satisfies ActionFunction;

export const SpeakersComponent = () => {
  const { speakers } = useLoaderData() as { speakers: Speaker[] | undefined };
  const actionData = useActionData();
  const [showNew, setShowNew] = useState(!speakers || !speakers.length);

  if (!speakers) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto px-6 max-w-7xl md:px-12">
            <h1 className="podscribe">Speakers</h1>

            <p>Loading</p>
          </div>
        </div>
      </section>
    );
  }

  const toggleShowForm = () => {
    setShowNew(!showNew);
  };

  useEffect(() => {
    if (actionData) {
      const form = document.getElementById("addSpeakerForm") as HTMLFormElement | null;
      if (form) {
        form.reset();
      }
    }
  }, [actionData]);

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="podscribe">Speakers</h1>

          {speakers.length ? (
            <>
              <p>Here you can find all speakers in all episodes.</p>

              <ul className="mt-8 divide-y border-y *:py-3 *:flex *:items-center *:gap-3">
                {speakers.map((x) => (
                  <li key={x.id}>
                    <SpeakerDetailComponent speaker={x} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No speakers have been added yet.</p>
          )}

          {showNew ? (
            <Form method="post" id="addSpeakerForm">
              <h2 className="podscribe">Add Speaker</h2>
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
                    />
                  </div>
                </div>
                <div className="flex flex-row pt-2">
                  <div className="w-40" />
                  <button type="submit" className="btn variant-primary p-1">
                    Create Speaker
                  </button>
                  {speakers.length ? (
                    <button
                      type="button"
                      className="btn variant-soft p-1 ml-5"
                      onClick={toggleShowForm}
                      onKeyDown={toggleShowForm}
                    >
                      Cancel
                    </button>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </Form>
          ) : (
            <button
              type="button"
              className="btn variant-ghost mt-8 p-1"
              onClick={toggleShowForm}
              onKeyDown={toggleShowForm}
            >
              Add speaker
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
