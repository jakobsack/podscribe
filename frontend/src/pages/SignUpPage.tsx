import { useEffect, useState } from "react";
import type { ActionFunction, ActionFunctionArgs } from "react-router-dom";
import { Form, useActionData } from "react-router-dom";

export const signUpAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();
  const data = Object.fromEntries(formData as unknown as Iterable<[PropertyKey, string]>);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const body = JSON.stringify(data);
  const req = await fetch("/api/auth/register", { method: "POST", headers, body });

  return req.status === 200;
}) satisfies ActionFunction;

export const SignUpPage = () => {
  const actionData = useActionData() as boolean | undefined;
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  useEffect(() => {
    if (actionData) {
      setShowVerifyEmail(true);
    }
  }, [actionData]);

  if (showVerifyEmail) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto px-6 max-w-7xl md:px-12">
            <h1 className="podscribe">Sign up</h1>

            <p>
              Thank you for signing up. We've sent you an email where with instructions to complete your registration.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="podscribe">Sign up</h1>
          <p>Sign up.</p>

          <Form method="post" id="addSpeakerForm">
            <div className="flex flex-col">
              <div className="flex flex-row">
                <div className="w-40">
                  <label htmlFor="formName">Name</label>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    name="name"
                    id="formName"
                    className="input variant-outlined border border-gray-300 p-1"
                    placeholder="Name"
                  />
                </div>
              </div>
              <div className="flex flex-row pt-2">
                <div className="w-40">
                  <label htmlFor="formEmail">Email</label>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    name="email"
                    id="formEmail"
                    className="input variant-outlined border border-gray-300 p-1"
                    placeholder="Email"
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
                    className="input variant-outlined border border-gray-300 p-1"
                    name="password"
                    id="formPassword"
                    placeholder="password"
                  />
                </div>
              </div>
              <div className="flex flex-row pt-2">
                <div className="w-40" />
                <button type="submit" className="btn variant-primary p-1">
                  Sign Up
                </button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
};
