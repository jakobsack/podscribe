import type { Speaker, EpisodeSpeaker } from "../../definitions";
import { ShowPartComponent } from "./ShowPart";
import type { NewPart } from "./definitions";

interface SpeakerPartsParams {
  parts: NewPart[];
  episodeId: number;
  episodeSpeakerId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
}

export const SpeakerPartsComponent = ({
  parts,
  episodeId,
  episodeSpeakerId,
  speakers,
  episodeSpeakers,
}: SpeakerPartsParams) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x, i, a) => (
          <div key={x.id} className={`flex flex-row ${i === a.length - 1 ? "" : "border-b border-gray-200"}`}>
            <ShowPartComponent
              episodeId={episodeId}
              part={x}
              episodeSpeakerId={episodeSpeakerId}
              speakers={speakers}
              episodeSpeakers={episodeSpeakers}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
