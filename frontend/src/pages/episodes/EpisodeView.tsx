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

  if (!episode) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <strong>Loading</strong>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <h1 className="podscribe">{episode.episode.title}</h1>

          <p>
            <Link to="edit" className="hover:link btn variant-soft w-44 p-1">
              Change to edit view
            </Link>
          </p>

          <div className="grid items-start gap-12 md:grid-cols-2 md:gap-0 lg:gap-12">
            <div className="pt-2 lg:pr-24">
              <Markdown className="markdown">{episode.episode.description}</Markdown>
            </div>
            <div className="card variant-outlined overflow-hidden ">
              <h3 className="pb-2 font-semibold text-title text-xl underline">Speakers</h3>

              <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-1">
                {episode.episode_speakers.map((x) => (
                  <li
                    key={x.id}
                    onClick={selectHighlightedSpeaker(x.id)}
                    onKeyDown={selectHighlightedSpeaker(x.id)}
                    className={highlightedSpeaker === x.id ? "bg-slate-100 dark:bg-slate-800" : ""}
                  >
                    {episode.speakers.find((y) => y.id === x.speaker_id)?.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="podscribe">Transcript</h2>

          <TranscriptComponent
            episodeSpeakers={episode.episode_speakers}
            parts={episode.parts}
            speakers={episode.speakers}
            highlightedSpeaker={highlightedSpeaker}
          />
        </div>
      </div>
    </section>
  );
};
