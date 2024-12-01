import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";

export const editPartAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();

  console.log(formData);
  const episodeId = event.params.episodeId;
  const partId = event.params.partId;

  const json = formData.get("json");
  if (!json) {
    throw new Error("What just happened?");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = json;

  return;
  const req = await fetch(`/api/episodes/${episodeId}/parts/${partId}/update`, {
    method: "PUT",
    headers,
    body,
  });
  return await req.json();
}) satisfies ActionFunction;
