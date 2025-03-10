import { useLoaderData } from "react-router-dom";
import type { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";

export const verifyLoader = (async (args: LoaderFunctionArgs) => {
  const verificationToken = args.params.verificationToken;
  const response = await fetch(`/api/auth/verify/${verificationToken}`);
  return { succeeded: response.status === 200 };
}) satisfies LoaderFunction;

export const VerifyPage = () => {
  const { succeeded } = (useLoaderData() as { succeeded: boolean }) || undefined;

  if (succeeded) {
    return (
      <section className="relative">
        <div className="relative">
          <div className="mx-auto px-6 max-w-7xl md:px-12">
            <h1 className="podscribe">Verification succeeded</h1>

            <p>Thank you for verifying your email address. You are able to login now.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <div className="relative">
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          <h1 className="podscribe">Verification failed</h1>

          <p>For some reason the verification failed. Sorry. Please contact the administrator.</p>
        </div>
      </div>
    </section>
  );
};
