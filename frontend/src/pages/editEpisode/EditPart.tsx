import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";
import { jwtFetch } from "../../common/jwtFetch";

export const editPartAction = async (event: ActionFunctionArgs, formData: FormData) => {
  const episodeId = event.params.episodeId;

  const partId = formData.get("partId");

  const json = formData.get("json");
  if (!json) {
    throw new Error("What just happened?");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = json;

  const req = await jwtFetch(`/api/episodes/${episodeId}/parts/${partId}/update`, {
    method: "POST",
    headers,
    body,
  });
  return await req.text();
};
