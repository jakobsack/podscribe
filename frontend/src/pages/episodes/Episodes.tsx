import { useEffect, useState } from "react";
import type { Episode } from "../../definitions";
import { Link } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";

export const EpisodesComponent = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    jwtFetch("/api/episodes")
      .then((x) => {
        return x.json() as Promise<Episode[]>;
      })
      .then((x) => setEpisodes(x))
      .catch((error) => console.error(error));
  }, []);

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="text-3xl text-title font-semibold pb-2 underline">Episodes</h1>

          <ul className="mt-8 divide-y border-y *:py-3 *:flex *:items-center *:gap-3">
            {episodes.map((x) => (
              <li key={x.id}>
                <Link to={`${x.id}`}>{x.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
