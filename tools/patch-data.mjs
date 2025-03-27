import fs from "node:fs";
import * as xml from "xml-js";
import * as html2text from "html-to-text"

const settings = JSON.parse(fs.readFileSync("settings.json"))

const rssReq = await fetch(settings.rssFeed);
const rssXml = await rssReq.text();

const rss = JSON.parse(xml.xml2json(rssXml, { compact: true, ignoreComment: true }));

const headers = { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${settings.token}` }
const existingEpisodes = await (await fetch(`${settings.hostname}/api/episodes`, { headers })).json();

if (!Array.isArray(rss.rss?.channel?.item)) {
  console.log("Downloaded file does not have expected format.")
  process.exit(1)
}

for (const item of rss.rss.channel.item) {
  if (!(item.enclosure?._attributes?.url && item.title?._text && item.link?._cdata && item.pubDate?._text && item.description?._cdata)) {
    console.log("item is missing required fields!")
    continue;
  }

  const fileUrl = item.enclosure._attributes.url;
  const fileNameQuery = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
  const fileName = fileNameQuery.substring(0, fileNameQuery.indexOf(".mp3"));

  const existingEpisode = existingEpisodes.find(x => x.filename === fileName);
  if (!existingEpisode) {
    continue;
  }

  let somethingChanged = false;
  const title = item.title._text
  if (existingEpisode.title !== title) {
    existingEpisode.title = title;
    somethingChanged = true;
  }

  const link = item.link._cdata
  if (existingEpisode.link !== link) {
    existingEpisode.link = link;
    somethingChanged = true;
  }

  const published_at = new Date(Date.parse(item.pubDate._text)).toISOString();
  if (existingEpisode.published_at !== published_at) {
    existingEpisode.published_at = published_at;
    somethingChanged = true;
  }

  if (!existingEpisode.description) {
    const descriptionRaw = item.description._cdata;
    const descriptionLong = html2text.convert(descriptionRaw)
    const descriptionUntrimmed = descriptionLong.includes(settings.cropDescriptionAt) ? descriptionLong.substring(0, descriptionLong.indexOf(settings.cropDescriptionAt)) : descriptionLong;
    const description = descriptionUntrimmed.trim();
    existingEpisode.description = description;
    somethingChanged = true;
  }

  if (somethingChanged) {
    console.log(`Updating ${existingEpisode.title}`)
    await (await fetch(`${settings.hostname}/api/episodes/${existingEpisode.id}`, { method: "PUT", headers, body: JSON.stringify(existingEpisode) })).json();
  }
}

console.log("done")
