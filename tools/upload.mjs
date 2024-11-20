import fs from "node:fs";
import path from "node:path"

async function dumpFile(file) {
  console.log(`Processing ${file}`)
  const episodeName = path.basename(file, "json");

  const headers = { "Content-Type": "application/json", "Accept": "application/json" }
  const transcript = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

  const speakerNames = transcript.transcription.map(x => x.speaker).filter((x, i, a) => a.indexOf(x) === i);

  // Episodes
  const existingEpisodes = await (await fetch("http://localhost:5150/api/episodes")).json();
  let existingEpisode = existingEpisodes.find(x => x.name === episodeName);
  if (!existingEpisode) {
    console.log(`Creating episode ${episodeName}`)
    const body = JSON.stringify({ name: episodeName, description: "", link: "" })
    const req = await fetch("http://localhost:5150/api/episodes", { method: "POST", headers, body })
    existingEpisode = await req.json()
    existingEpisodes.push(existingEpisode)
  }

  // Speakers
  const existingSpeakers = await (await fetch("http://localhost:5150/api/speakers", { headers })).json();
  for (const speakerName of speakerNames) {
    if (existingSpeakers.some(x => x.name === speakerName)) {
      continue;
    }

    console.log(`Creating speaker ${speakerName}`)
    const body = JSON.stringify({ name: speakerName })
    const req = await fetch("http://localhost:5150/api/speakers", { method: "POST", headers, body })
    existingSpeakers.push(await req.json())
  }

  if (!existingEpisode) {
    throw new Error("Lost the episode")
  }

  // Speaker connection
  const episodePath = `http://localhost:5150/api/episodes/${existingEpisode.id}`
  const existingEpisodeSpeakers = await (await fetch(`${episodePath}/speakers`, { headers })).json();
  const speakerMap = {}
  for (const speakerName of speakerNames) {
    const globalSpeaker = existingSpeakers.find(x => x.name === speakerName);
    let episodeSpeaker = existingEpisodeSpeakers.find(x => x.speaker_id === globalSpeaker.id);

    if (!episodeSpeaker) {
      console.log(`Creating episode speaker ${speakerName}`)
      const body = JSON.stringify({ speaker_id: globalSpeaker.id })
      const req = await fetch(`${episodePath}/speakers`, { method: "POST", headers, body })
      episodeSpeaker = await req.json()
      existingEpisodeSpeakers.push(episodeSpeaker);
    }

    speakerMap[speakerName] = episodeSpeaker.id;
  }

  // parts
  const existingParts = await (await fetch(`${episodePath}/parts`, { headers })).json();
  for (const part of transcript.transcription) {
    let existingPart = existingParts.find(x => Math.abs(x.starts_at - part.start) < 0.00001 && Math.abs(x.ends_at - part.end) < 0.00001);

    if (!existingPart) {
      console.log(`Creating part ${part.start} - ${part.end}`)
      const body = JSON.stringify({ episode_speaker_id: speakerMap[part.speaker], text: part.text, starts_at: part.start, ends_at: part.end })
      const req = await fetch(`${episodePath}/parts`, { method: "POST", headers, body })
      existingPart = await req.json()
      existingParts.push(existingPart);
    }

    const partPath = `${episodePath}/parts/${existingPart.id}`
    const existingSections = await (await fetch(`${partPath}/sections`, { headers })).json();
    for (const section of part.sections) {
      let existingSection = existingSections.find(x => Math.abs(x.starts_at - section.start) < 0.00001 && Math.abs(x.ends_at - section.end) < 0.00001);

      if (!existingSection) {
        console.log(`Creating section ${section.start} - ${section.end}`)
        const body = JSON.stringify({
          words_per_second: section.words_per_second,
          starts_at: section.start,
          ends_at: section.end,
          corrected: false,
          text: section.text
        });
        const req = await fetch(`${partPath}/sections`, { method: "POST", headers, body })
        existingSection = await req.json()
        existingSections.push(existingSection);
      }

      const sectionPath = `${partPath}/sections/${existingSection.id}`
      const existingWords = await (await fetch(`${sectionPath}/words`, { headers })).json();
      for (const word of section.words) {
        let existingWord = existingWords.find(x => Math.abs(x.starts_at - word.start) < 0.00001 && Math.abs(x.ends_at - word.end) < 0.00001);

        if (!existingWord) {
          console.log(`Creating word ${word.start} - ${word.end}`)
          const body = JSON.stringify({
            starts_at: word.start,
            ends_at: word.end,
            probability: word.probability,
            text: word.text,
            hidden: false,
            manual: false,
          });
          const req = await fetch(`${sectionPath}/words`, { method: "POST", headers, body })
          existingWord = await req.json()
          existingWords.push(existingWord);
        }
      }
    }
  }
}

const files = fs.readdirSync("collection");
for (const file of files) {
  if (!file.endsWith(".json") || file.startsWith(".")) {
    console.log(`Skipping ${file}`)
    continue
  }

  await dumpFile(`collection/${file}`)
}
