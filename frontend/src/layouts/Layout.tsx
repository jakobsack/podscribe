import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

export const Layout = () => {
  const { token, setToken } = useAuth();

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log("Session expired, logging out");
        setToken(null);
      }
    }
  }, [token, setToken]);

  const navBar = token ? (
    <>
      <div className="md:-ml-4 mt-6 lg:mt-0 lg:pr-4 dark:text-body">
        <ul className="space-y-6 text-base tracking-wide lg:flex lg:space-y-0 lg:text-sm">
          <li>
            <Link to={"search"} className="hover:link block md:px-4">
              <span>Search</span>
            </Link>
          </li>

          <li>
            <Link to={"episodes"} className="hover:link block md:px-4">
              <span>Episode</span>
            </Link>
          </li>

          <li>
            <Link to={"speakers"} className="hover:link block md:px-4">
              <span>Speakers</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex w-full flex-col items-center gap-2 space-y-2 border-t pt-6 pb-4 lg:w-fit lg:flex-row lg:space-y-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pb-0 lg:pl-2">
        <Link to="logout" className="hover:link">
          <button className="btn variant-danger sz-sm" type="button">
            <span>Logout</span>
          </button>
        </Link>
      </div>
    </>
  ) : (
    <div className="flex w-full flex-col items-center gap-2 space-y-2 border-t pt-6 pb-4 lg:w-fit lg:flex-row lg:space-y-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pb-0 lg:pl-2">
      <Link to={"login"}>
        <button className="btn variant-ghost sz-sm" type="button">
          <span className="btn-label">Login</span>
        </button>
      </Link>
      <Link to={"signup"}>
        <button className="btn variant-neutral sz-sm" type="button">
          <span className="btn-label">Sign Up</span>
        </button>
      </Link>
    </div>
  );

  return (
    <>
      <header id="header" className="group">
        <nav className="fixed z-20 w-full overflow-hidden border-b bg-white/50 backdrop-blur-2xl dark:bg-gray-950/50">
          <div className="m-auto max-w-6xl px-6 ">
            <div className="flex flex-wrap items-center justify-between py-2 sm:py-4">
              <div className="flex w-full items-center justify-between lg:w-auto">
                <a href="/" aria-label="tailus logo">
                  Podscribe
                </a>
                <div className="flex lg:hidden">
                  <button
                    type="button"
                    id="menu-btn"
                    aria-label="open menu"
                    className="btn variant-ghost sz-md icon-only -mr-2.5 relative z-20 block cursor-pointer lg:hidden"
                  >
                    <svg
                      className="m-auto size-6 text-title transition-[transform,opacity] duration-300 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <title>Open Menu</title>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                    </svg>
                    <svg
                      className="-rotate-180 absolute inset-0 m-auto size-6 scale-0 text-title opacity-0 transition-[transform,opacity] duration-300 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <title>Close menu</title>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="h-0 w-full flex-wrap items-center justify-end space-y-8 group-data-[state=active]:h-fit md:flex-nowrap lg:flex lg:h-fit lg:w-fit lg:space-y-0">
                {navBar}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="overflow-hidden pt-24 lg:pt-28">
        <Outlet />
      </main>
    </>
  );
};
