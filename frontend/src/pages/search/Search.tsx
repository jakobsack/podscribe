import type { ActionFunctionArgs, ActionFunction } from "react-router-dom";
import { Form, useActionData } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";
import type { Episode, Part } from "../../definitions";
import { SpeakerPartComponent } from "../episodes/SpeakerPart";
import React from "react";

interface SearchResult {
  episodes: Episode[];
  parts: Part[];
  search_results: { id: number; score: number }[];
}

export const searchAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();
  const input = Object.fromEntries(formData as unknown as Iterable<[PropertyKey, string]>);
  const query = input.query;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const req = await jwtFetch(`/api/episodes/search?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers,
  });

  const searchResult = await req.json();
  return searchResult;
}) satisfies ActionFunction;

export const SearchComponent = () => {
  const actionData = useActionData() as SearchResult;

  let partsInOrder: Part[] | undefined = undefined;
  let episodesInOrder: Episode[] | undefined = undefined;

  if (actionData) {
    partsInOrder = actionData.search_results
      .sort((a, b) => a.score - b.score)
      .map((x) => actionData.parts.find((y) => y.id === x.id))
      .filter((x) => x) as Part[];
    episodesInOrder = partsInOrder
      .map((x) => actionData.episodes.find((y) => y.id === x.episode_id))
      .filter((x, i, a) => x && a.indexOf(x) === i) as Episode[];

    // Resort parts. We want the episodes sorted by relevance,
    // but it looks strange if the parts are not sorted ascending
    partsInOrder.sort((a, b) => a.starts_at - b.starts_at);
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <h1 className="podscribe">Search</h1>

          <p>Welcome to the search page. You can use the box below to search for text in all episodes.</p>

          <Form method="post">
            <div className="mt-3 flex flex-row">
              <div className="hidden w-40">
                <label htmlFor="formQuery">Name</label>
              </div>
              <div className="w-80">
                <input
                  type="text"
                  name="query"
                  id="formQuery"
                  className="input variant-outlined border border-gray-300 p-1 dark:border-gray-600"
                  placeholder="Search"
                  defaultValue=""
                />
              </div>
              <button type="submit" className="btn variant-primary ml-2 p-1">
                Search
              </button>
            </div>
          </Form>
        </div>

        {actionData && episodesInOrder && partsInOrder && (
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <h2 className="podscribe">Search results</h2>

            {episodesInOrder.length ? (
              episodesInOrder.map((episode) => (
                <React.Fragment key={episode.id}>
                  <h3 className="podscribe">{episode.title}</h3>

                  <div className="flex flex-col">
                    {partsInOrder
                      .filter((x) => x.episode_id === episode.id)
                      .map((part, i, a) => (
                        <SpeakerPartComponent
                          key={part.id}
                          part={{ id: part.id, text: part.text, start: part.starts_at }}
                          isLastRow={i === a.length - 1}
                        />
                      ))}
                  </div>
                </React.Fragment>
              ))
            ) : (
              <p>Sorry, we did not find any results.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
