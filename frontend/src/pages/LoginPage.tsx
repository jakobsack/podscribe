import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { Form, Navigate, redirect, useActionData, useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
  return { token: auth.token };
}) satisfies ActionFunction;

interface LoginParams {
  token?: string;
}
export const LoginPage = () => {
  const { setToken } = useAuth();

  const actionData = useActionData() as LoginParams | undefined;
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.token) {
      setToken(actionData.token);
      localStorage.setItem("lastRefresh", Date.now().toString());
      navigate("/", { replace: true });
    }
  }, [actionData, setToken, navigate]);

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto max-w-xl px-6 md:px-12">
          <h1 className="podscribe">Login</h1>
          <p>Please enter your credentials.</p>

          <Form method="post">
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
                    className="input variant-outlined border border-gray-300 p-1 dark:border-gray-600 "
                    placeholder="email@domain.com"
                  />
                </div>
              </div>
              <div className="flex flex-row pt-2">
                <div className="w-40">
                  <label htmlFor="formPassword">Password</label>
                </div>
                <div className="flex-1">
                  <input
                    type="password"
                    className="input variant-outlined border border-gray-300 p-1 dark:border-gray-600 "
                    name="password"
                    id="formPassword"
                    placeholder="password"
                  />
                </div>
              </div>
              <div className="flex flex-row pt-2">
                <button type="submit" className="btn variant-primary p-1">
                  Login
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
};
