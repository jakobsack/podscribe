import type { ActionFunctionArgs, ActionFunction } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";

export const editSpeakerAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();
  const update = Object.fromEntries(formData as unknown as Iterable<[PropertyKey, string]>);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const speakerId = event.params.speakerId;
  const body = JSON.stringify(update);
  const req = await jwtFetch(`/api/speakers/${speakerId}`, {
    method: "PUT",
    headers,
    body,
  });
  return await req.json();
}) satisfies ActionFunction;
