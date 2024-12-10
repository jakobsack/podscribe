import type { Word } from "../../definitions";

export function getWordColor(word: Word): string {
  if (word.overwrite) return "bg-gray-200";
  if (word.probability > 0.99) return "bg-blue-200";
  if (word.probability > 0.9) return "bg-green-200";
  if (word.probability > 0.7) return "bg-yellow-200";
  return "bg-red-200";
}
