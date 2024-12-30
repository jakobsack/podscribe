import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";
import { useFetcher } from "react-router-dom";
import { useState } from "react";

export const loginAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();
  const data = Object.fromEntries(formData as unknown as Iterable<[PropertyKey, string]>);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = JSON.stringify(data);
  const req = await fetch("/api/auth/login", { method: "POST", headers, body });
  const auth = await req.json();
  localStorage.setItem("jwtToken", auth.token);
  return null;
}) satisfies ActionFunction;

export const LoginComponent = () => {
  const [showForm, setShowForm] = useState(true);

  const fetcher = useFetcher();

  if (fetcher.formData && showForm) {
    // Hide form
    setShowForm(false);
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          {showForm ? (
            <fetcher.Form method="post">
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <div className="w-40">
                    <label htmlFor="formEmail">Email</label>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      name="email"
                      id="formEmail"
                      className="border border-gray-300"
                      placeholder="email@domain.com"
                    />
                  </div>
                </div>
                <div className="flex flex-row pt-2">
                  <div className="w-40">
                    <label htmlFor="formPassword">Password</label>
                  </div>
                  <input
                    type="password"
                    className="border border-gray-300"
                    name="password"
                    id="formPassword"
                    placeholder="password"
                  />
                </div>
                <div className="flex flex-row pt-2">
                  <button type="submit" className="btn bg-primary-500 text-white p-1">
                    Login
                  </button>
                </div>
              </div>
            </fetcher.Form>
          ) : (
            <>
              <p>Login</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
