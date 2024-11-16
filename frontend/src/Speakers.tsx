import { useEffect, useState } from "react";
import type { Speaker } from "./definitions";

export const Speakers = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    fetch("/api/speakers")
      .then((x) => {
        return x.json() as Promise<Speaker[]>;
      })
      .then((x) => setSpeakers(x))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div>
      <ul>
        {speakers.map((x) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
    </div>
  );
};
