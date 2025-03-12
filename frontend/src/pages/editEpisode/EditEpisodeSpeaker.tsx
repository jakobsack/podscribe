import type { ActionFunctionArgs } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";

export const editEpisodeSpeakerAction = async (event: ActionFunctionArgs, formData: FormData) => {
  const episodeId = event.params.episodeId;

  const speakerId = formData.get("episodeSpeakerId");

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
  const req = await jwtFetch(`/api/episodes/${episodeId}/speakers/${speakerId}`, {
    method: "PUT",
    headers,
    body,
  });
  return await req.json();
};
