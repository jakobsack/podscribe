import { SpeakerPartComponent } from "./SpeakerPart";
import type { SpeakerPart } from "./Transcript";

interface SpeakerPartsParams {
  speakerPart: SpeakerPart;
  isLastRow?: boolean;
  isHighlighted?: boolean;
}

export const SpeakerPartsComponent = ({ speakerPart, isLastRow, isHighlighted }: SpeakerPartsParams) => {
  return (
    <div className={`flex flex-row items-stretch border-b-2 border-gray-300 ${isHighlighted ? "bg-slate-100" : ""}`}>
      <div className={`w-40 ${isLastRow ? "" : "border-r border-gray-200"}`}>{speakerPart.speaker}</div>
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
