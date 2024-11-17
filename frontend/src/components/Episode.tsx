import type { EpisodeDisplay } from "../definitions";
import { useLoaderData } from "react-router-dom";
import type { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { TranscriptTable } from "./TranscriptTable";

export const episodeLoader = (async (args: LoaderFunctionArgs) => {
  const episodeId = args.params.episodeId;
  const response = await fetch(`/api/episodes/${episodeId}/display`);
  const result = (await response.json()) as EpisodeDisplay;
  return { episode: result };
}) satisfies LoaderFunction;

export const Episode = () => {
  const { episode } = useLoaderData() as { episode: EpisodeDisplay };

  return (
    <div>
      {episode ? (
        <>
          <h1>{episode.episode.name}</h1>

          {episode.episode.description}

          <h2>Transcript</h2>

          <TranscriptTable
            episode={episode.episode}
            episodeSpeakers={episode.episode_speakers}
            parts={episode.parts}
            speakers={episode.speakers}
          />
        </>
      ) : (
        <b>Loading</b>
      )}
    </div>
  );
};
