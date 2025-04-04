import type { Word } from "../../definitions";

export function getWordColor(word: Word, ignoreOverwrite = false): string {
  if (word.overwrite && !ignoreOverwrite) return "bg-gray-200 dark:bg-gray-700";
  if (word.probability > 0.99) return "bg-blue-200 dark:bg-blue-700";
  if (word.probability > 0.9) return "bg-green-200 dark:bg-green-700";
  if (word.probability > 0.7) return "bg-yellow-200 dark:bg-yellow-700";
  return "bg-red-200 dark:bg-red-700";
}
