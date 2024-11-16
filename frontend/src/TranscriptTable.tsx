import type { Episode, EpisodeSpeaker, Part, Speaker } from "./definitions";

interface foo {
  episode: Episode;
  parts: Part[];
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

interface NewPart {
  id: number;
  speaker: string;
  text: string;
  start: number;
}

export const TranscriptTable = ({
  episode,
  parts,
  speakers,
  episodeSpeakers,
}: foo) => {
  const speakerNames: { [key: number]: string } = {};
  for (const episodeSpeaker of episodeSpeakers) {
    speakerNames[episodeSpeaker.id] =
      speakers.find((x) => x.id === episodeSpeaker.speaker_id)?.name ||
      "UNKNOWN";
  }

  let lastSpeaker = "";
  const newParts: NewPart[] = [];
  for (const part of parts) {
    if (!part.text) {
      continue;
    }

    const speaker = speakerNames[part.episode_speaker_id];
    newParts.push({
      id: part.id,
      speaker: lastSpeaker === speaker ? "" : speaker,
      text: part.text,
      start: part.starts_at,
    });
    lastSpeaker = speaker;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Speaker</th>
          <th>Text</th>
          <th>Start</th>
        </tr>
      </thead>
      <tbody>
        {newParts.map((x) => {
          return (
            <tr key={x.id}>
              <td>{x.speaker || " "}</td>
              <td>{x.text}</td>
              <td>{x.start}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
