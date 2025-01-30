import type { EpisodeDisplay } from "../../definitions";
import { Link, useLoaderData } from "react-router-dom";
import type { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { useState } from "react";
import Markdown from "react-markdown";
import { TranscriptComponent } from "./Transcript";
import { jwtFetch } from "../../common/jwtFetch";

export const episodeViewLoader = (async (args: LoaderFunctionArgs) => {
  const episodeId = args.params.episodeId;
  const response = await jwtFetch(`/api/episodes/${episodeId}/display`);
  const result = (await response.json()) as EpisodeDisplay;
  return { episode: result };
}) satisfies LoaderFunction;

export const EpisodeViewComponent = () => {
  const { episode } = useLoaderData() as { episode: EpisodeDisplay };

  const [highlightedSpeaker, setHighlightedSpeaker] = useState(0);
  const selectHighlightedSpeaker = (speakerId: number) => {
    return () => {
      setHighlightedSpeaker(speakerId);
    };
  };

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          {episode ? (
            <>
              <h1 className="text-3xl text-title font-semibold pb-2 underline">{episode.episode.name}</h1>

              <p>
                <Link to="edit" className="hover:link ">
                  Change to edit view
                </Link>
              </p>

              <div className="grid gap-12 md:gap-0 md:grid-cols-2 items-start lg:gap-12">
                <div className="lg:pr-24 pt-2">
                  <Markdown>{episode.episode.description}</Markdown>
                </div>
                <div className="card variant-outlined overflow-hidden ">
                  <h3 className="text-xl text-title font-semibold pb-2 underline">Speakers</h3>

                  <ul className="mt-8 divide-y border-y *:py-1 *:flex *:items-center *:gap-3">
                    {episode.episode_speakers.map((x) => (
                      <li
                        key={x.id}
                        onClick={selectHighlightedSpeaker(x.id)}
                        onKeyDown={selectHighlightedSpeaker(x.id)}
                        className={highlightedSpeaker === x.id ? "bg-slate-100" : ""}
                      >
                        {episode.speakers.find((y) => y.id === x.speaker_id)?.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl text-title font-semibold pb-2 underline">Transcript</h2>

              <TranscriptComponent
                episodeSpeakers={episode.episode_speakers}
                parts={episode.parts}
                speakers={episode.speakers}
                highlightedSpeaker={highlightedSpeaker}
              />
            </>
          ) : (
            <strong>Loading</strong>
          )}
        </div>
      </div>
    </section>
  );
};
