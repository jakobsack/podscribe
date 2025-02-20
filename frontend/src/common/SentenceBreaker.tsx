interface SentenceBreakerParams {
  text: string;
}

const sentenceRegex = /([.!?] +)/g;

export const SentenceBreaker = ({ text }: SentenceBreakerParams) => {
  if (!text) {
    return <></>;
  }

  const parts = text.split(sentenceRegex);
  const blocks: string[] = [""];
  let counter = 0;
  for (const part of parts) {
    if (counter++ > 5) {
      counter = 1;
      blocks.push("");
    }
    blocks[blocks.length - 1] += part;
  }

  return blocks.map((x) => <p key={x}>{x.trim()}</p>);
};
