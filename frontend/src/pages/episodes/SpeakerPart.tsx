import { SentenceBreaker } from "../../common/SentenceBreaker";
import { Timestamp } from "../../common/Timestamp";
import type { ReducedPart, SpeakerPart } from "./Transcript";

interface SpeakerPartsParams {
  part: ReducedPart;
  isLastRow?: boolean;
}

export const SpeakerPartComponent = ({ part, isLastRow }: SpeakerPartsParams) => {
  return (
    <div className={`flex flex-row ${isLastRow ? "" : "border-gray-200 border-b dark:border-gray-700"}`}>
      <div className="w-20 text-right">
        <Timestamp seconds={part.start} />
      </div>
      <div className="ml-2 flex-1">
        <SentenceBreaker text={part.text} />
      </div>
    </div>
  );
};
