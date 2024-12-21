import fs from "node:fs";
import path from "node:path"

async function dumpFile(file) {
  console.log(`Processing ${file}`)
  const episodeName = path.basename(file, "json");

  const headers = { "Content-Type": "application/json", "Accept": "application/json" }
  const transcript = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

  // Episodes
  const existingEpisodes = await (await fetch("http://localhost:5150/api/episodes")).json();
  let existingEpisode = existingEpisodes.find(x => x.name === episodeName);
  if (!existingEpisode) {
    console.log(`Creating episode ${episodeName}`)
    const body = JSON.stringify({ name: episodeName, description: "", link: "", has_audio_file: false })
    const req = await fetch("http://localhost:5150/api/episodes", { method: "POST", headers, body })
    existingEpisode = await req.json()
    existingEpisodes.push(existingEpisode)

    console.log(`Uploading content for ${episodeName}`)
    const importBody = JSON.stringify(transcript)
    const importReq = await fetch(`http://localhost:5150/api/episodes/${existingEpisode.id}`, { method: "POST", headers, body: importBody })
    const text = await importReq.text()
    console.log(text)
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
