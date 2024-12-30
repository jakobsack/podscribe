type JwtRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function jwtFetch(input: RequestInfo | URL, init?: JwtRequestInit): Promise<Response> {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    const newInit = init || {};
    newInit.headers ||= {};
    newInit.headers.Authorization = `Bearer ${token}`;
    return await fetch(input, newInit);
  }

  return await fetch(input, init);
}
