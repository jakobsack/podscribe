import { SentenceBreaker } from "../../common/SentenceBreaker";
import { Timestamp } from "../../common/Timestamp";
import type { ReducedPart, SpeakerPart } from "./Transcript";

interface SpeakerPartsParams {
  part: ReducedPart;
  isLastRow?: boolean;
}

export const SpeakerPartComponent = ({ part, isLastRow }: SpeakerPartsParams) => {
  return (
    <div className={`flex flex-row ${isLastRow ? "" : "border-b border-gray-200"}`}>
      <div className="w-20 text-right">
        <Timestamp seconds={part.start} />
      </div>
      <div className="flex-1 ml-2">
        <SentenceBreaker text={part.text} />
      </div>
    </div>
  );
};
