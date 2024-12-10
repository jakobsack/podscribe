import { useState } from "react";
import type { Speaker } from "../../definitions";

import { Form, useLoaderData } from "react-router-dom";
import type { ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { SpeakerDetailComponent } from "./SpeakerDetail";

export const speakersLoader = (async (_args: LoaderFunctionArgs) => {
  const response = await fetch("/api/speakers");
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
  const req = await fetch("/api/speakers", { method: "POST", headers, body });
  return await req.json();
}) satisfies ActionFunction;

export const SpeakersComponent = () => {
  const { speakers } = useLoaderData() as { speakers: Speaker[] };
  const [showNew, setShowNew] = useState(!speakers || !speakers.length);

  const toggleShowForm = () => {
    setShowNew(!showNew);
  };

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="text-3xl text-title font-semibold pb-2 underline">Speakers</h1>

          <p>Here you can find all speakers in all episodes.</p>

          {speakers ? (
            <>
              <ul className="mt-8 divide-y border-y *:py-3 *:flex *:items-center *:gap-3">
                {speakers.map((x) => (
                  <li key={x.id}>
                    <SpeakerDetailComponent speaker={x} />
                  </li>
                ))}
              </ul>

              {showNew ? (
                <Form method="post">
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
                      />
                    </div>
                    <div>
                      <button type="submit" className="btn bg-primary-500 text-white p-1">
                        Create Speaker
                      </button>
                      <p className="text-gray-400 text-sm pt-1">
                        The episodes are assigned to the speaker at a later point in time using the Episode view.
                      </p>
                    </div>
                  </div>
                  <p onClick={toggleShowForm} onKeyDown={toggleShowForm}>
                    Hide form
                  </p>
                </Form>
              ) : (
                <p onClick={toggleShowForm} onKeyDown={toggleShowForm}>
                  Show new form
                </p>
              )}
            </>
          ) : (
            <p>Loading</p>
          )}
        </div>
      </div>
    </section>
  );
};
