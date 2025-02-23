import fs from "node:fs";

async function fixFile(file) {
  console.log(`Processing ${file}`);

  const transcript = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

  // Filter parts that are very short or very fast.
  transcript.transcription = transcript.transcription.filter(part => {
    const length = part.end - part.start;
    if (length < 0.1) {
      console.log(`Found very short part: ${(part.end - part.start).toFixed(5)} ${part.text}`);
      return false;
    }

    const words = part.sentences.reduce((sum, sentence) => sum + sentence.words.length, 0);
    const part_wps = words / length;
    if (part_wps > 20) {
      console.log(`Found very fast part: ${part_wps.toFixed(1)} ${part.text}`);
      return false;
    }

    return true;
  })

  // Filter sentences that are very short or very fast
  for (const part of transcript.transcription) {
    part.sentences = part.sentences.filter((sentence) => {
      if (sentence.end - sentence.start < 0.1) {
        console.log(`Found very short sentence: ${(sentence.end - sentence.start).toFixed(5)} ${sentence.text}`);
        return false;
      }

      if (sentence.words_per_second > 20) {
        console.log(`Found very fast sentence: ${sentence.words_per_second.toFixed(1)} ${sentence.text}`);
        return false;
      }

      return true;
    })

    part.text = part.sentences.map((x) => x.text).join(' ');
  }

  // Remove parts without sentences
  transcript.transcription = transcript.transcription.filter(x => x.sentences.length);

  fs.writeFileSync(file, JSON.stringify(transcript, undefined, 2), { encoding: "utf-8" });
}

const files = fs.readdirSync("collection");
for (const file of files) {
  if (!file.endsWith(".json")) {
    continue;
  }

  if (file.startsWith(".") || !fs.lstatSync(`collection/${file}`).isFile()) {
    console.log(`Skipping ${file}`)
    continue;
  }

  await fixFile(`collection/${file}`);
}
