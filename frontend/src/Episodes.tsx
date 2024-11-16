import { useEffect, useState } from "react";
import type { Episode } from "./definitions";
import { Link } from "react-router-dom";

export const Episodes = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    fetch("/api/episodes")
      .then((x) => {
        return x.json() as Promise<Episode[]>;
      })
      .then((x) => setEpisodes(x))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <ul>
        {episodes.map((x) => (
          <li key={x.id}>
            <Link to={`${x.id}`}>{x.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
