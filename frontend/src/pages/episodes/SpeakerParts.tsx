import { SpeakerPartComponent } from "./SpeakerPart";
import type { SpeakerPart } from "./Transcript";

interface SpeakerPartsParams {
  speakerPart: SpeakerPart;
  isLastRow?: boolean;
  isHighlighted?: boolean;
}

export const SpeakerPartsComponent = ({ speakerPart, isLastRow, isHighlighted }: SpeakerPartsParams) => {
  return (
    <div
      className={`flex flex-row items-stretch border-gray-300 border-b-2 dark:border-gray-600 ${isHighlighted ? "bg-slate-100 dark:bg-slate-800" : ""}`}
    >
      <div
        className={`w-40 ${isLastRow && "border-gray-200 border-r dark:border-gray-700"} ${speakerPart.part_type === 1 && "bg-pink-100 dark:bg-pink-800"}`}
      >
        {speakerPart.speaker}
      </div>
      <div className="flex-1">
        <div className="flex flex-col">
          {speakerPart.parts.map((x, i, a) => (
            <SpeakerPartComponent key={x.id} part={x} isLastRow={i === a.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
};
