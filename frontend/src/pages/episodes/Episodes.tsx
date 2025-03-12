import type { Episode } from "../../definitions";
import type { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";

import { Link, useLoaderData } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";

export const episodesLoader = (async (_args: LoaderFunctionArgs) => {
  const response = await jwtFetch("/api/episodes");
  const result = (await response.json()) as Episode[];
  const sorted = result.sort((a, b) => {
    if (a.published_at && b.published_at) {
      return b.published_at.localeCompare(a.published_at);
    }
    if (a.published_at) {
      return -1;
    }
    if (b.published_at) {
      return 1;
    }
    return b.filename.localeCompare(a.filename);
  });
  return { episodes: sorted };
}) satisfies LoaderFunction;

export const EpisodesComponent = () => {
  const { episodes } = useLoaderData() as { episodes: Episode[] | undefined };

  if (!episodes) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <h1 className="podscribe">Episodes</h1>

            <p>Loading ...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!episodes.length) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <h1 className="podscribe">Episodes</h1>
            <p>No episodes have been imported yet</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <h1 className="podscribe">Episodes</h1>

          <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
            {episodes.map((x) => (
              <li key={x.id}>
                <Link to={`${x.id}`} className="hover:link">
                  {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
