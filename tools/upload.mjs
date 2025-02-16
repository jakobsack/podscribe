import fs from "node:fs";
import path from "node:path"

const settings = JSON.parse(fs.readFileSync("settings.json"))

const headers = { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${settings.token}` }
const existingEpisodes = await (await fetch(`${settings.hostname}/api/episodes`, { headers })).json();

async function dumpFile(file) {
  console.log(`Processing ${file}`)
  const episodeName = path.basename(file, ".json");

  // Episodes
  let existingEpisode = existingEpisodes.find(x => x.filename === episodeName);
  if (!existingEpisode) {
    console.log(`Creating episode ${episodeName}`)
    const body = JSON.stringify({ title: episodeName, description: "", link: "", filename: episodeName, has_audio_file: false })
    const req = await fetch(`${settings.hostname}/api/episodes`, { method: "POST", headers, body })
    existingEpisode = await req.json()
    existingEpisodes.push(existingEpisode)
  }

  const partsReq = await fetch(`${settings.hostname}/api/episodes/${existingEpisode.id}/parts`, { headers })
  const existingParts = await partsReq.json()
  if (!existingParts.length) {
    const transcript = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

    console.log(`Uploading content for ${episodeName}`)
    const importBody = JSON.stringify(transcript)
    const importReq = await fetch(`${settings.hostname}/api/episodes/${existingEpisode.id}`, { method: "POST", headers, body: importBody })
    const text = await importReq.text()
    console.log(text)
  }

  if (!existingEpisode.has_audio_file) {
    const mp3File = path.join(path.dirname(file), `${episodeName}.mp3`)
    console.log(mp3File)
    if (fs.existsSync(mp3File)) {
      console.log(`Uploading audio for ${episodeName}`)

      const audioContent = fs.readFileSync(mp3File);
      const audioRequest = await fetch(
        `${settings.hostname}/api/episodes/${existingEpisode.id}/audio`,
        { method: "POST", headers: { ...headers, "Content-Type": "audio/mpeg" }, body: audioContent }
      )
      const updatedEpisode = await audioRequest.json();
      existingEpisode.has_audio_file = updatedEpisode.has_audio_file;
    }
  }
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

  await dumpFile(`collection/${file}`)
}
