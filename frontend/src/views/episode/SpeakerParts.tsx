import type { NewPart } from "./Transcript";

interface SpeakerPartsParams {
  parts: NewPart[];
}

export const SpeakerPartsComponent = ({ parts }: SpeakerPartsParams) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col">
        {parts.map((x, i, a) => (
          <div key={x.id} className={`flex flex-row ${i === a.length - 1 ? "" : "border-b border-gray-200"}`}>
            <div className="w-20 text-right">{x.start.toFixed(2)}</div>
            <div className="flex-1 ml-2">{x.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
