import fs from "node:fs";

async function fixFile(file) {
  console.log(`Processing ${file}`)

  const transcript = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

  for (const part of transcript.transcription) {
    if (part.sections) {
      part.sentences = part.sections;
      part.sections = undefined;
    }

    for (const sentence of part.sentences) {
      if (sentence.tokens) {
        sentence.words = sentence.tokens;
        sentence.tokens = undefined;
      }

      for (const word of sentence.words) {
        word.text = word.text.trim();
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(transcript, undefined, 2), { encoding: "utf-8" });
}

const files = fs.readdirSync("collection");
for (const file of files) {
  if (!file.endsWith(".json")) {
    continue;
  }

  if (file.startsWith(".") || !fs.lstatSync(`collection/${file}`).isFile()) {
    console.log(`Skipping ${file}`)
    continue
  }

  await fixFile(`collection/${file}`)
}
