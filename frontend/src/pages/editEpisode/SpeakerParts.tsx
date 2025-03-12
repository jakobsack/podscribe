import type { Speaker, EpisodeSpeaker } from "../../definitions";
import { ShowPartComponent } from "./ShowPart";
import type { NewPart } from "./definitions";

interface SpeakerPartsParams {
  parts: NewPart[];
  episodeId: number;
  speakers: Speaker[];
  episodeSpeakers: EpisodeSpeaker[];
  startAudioAt: (position: number) => void;
  curTime: number;
}

export const SpeakerPartsComponent = ({
  parts,
  episodeId,
  speakers,
  episodeSpeakers,
  startAudioAt,
  curTime,
}: SpeakerPartsParams) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x, i, a) => (
          <div
            key={x.id}
            className={`flex flex-row ${i === a.length - 1 ? "" : "border-gray-200 border-b dark:border-gray-700 "}`}
          >
            <ShowPartComponent
              episodeId={episodeId}
              part={x}
              speakers={speakers}
              episodeSpeakers={episodeSpeakers}
              startAudioAt={startAudioAt}
              curTime={curTime}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
