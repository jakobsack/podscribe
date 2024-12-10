import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";

export const editEpisodeSpeakerAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();

  const episodeId = event.params.episodeId;
  const speakerId = event.params.episodeSpeakerId;

  const rawSpeakerId = formData.get("speaker_id");
  if (!rawSpeakerId) {
    throw new Error("What just happened?");
  }

  const update = {
    speaker_id: Number.parseInt(rawSpeakerId.toString()),
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = JSON.stringify(update);
  const req = await fetch(`/api/episodes/${episodeId}/speakers/${speakerId}`, {
    method: "PUT",
    headers,
    body,
  });
  return await req.json();
}) satisfies ActionFunction;
