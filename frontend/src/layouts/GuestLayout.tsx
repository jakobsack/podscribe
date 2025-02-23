import { Link, Outlet } from "react-router-dom";

export const GuestLayout = () => {
  return (
    <>
      <header id="header" className="group">
        <nav className="fixed overflow-hidden z-20 w-full border-b bg-white/50 dark:bg-gray-950/50 backdrop-blur-2xl">
          <div className="px-6 m-auto max-w-6xl ">
            <div className="flex flex-wrap items-center justify-between py-2 sm:py-4">
              <div className="w-full items-center flex justify-between lg:w-auto">
                <a href="/" aria-label="tailus logo">
                  Podscribe
                </a>
              </div>
              <div className="w-full group-data-[state=active]:h-fit h-0 lg:w-fit flex-wrap justify-end items-center space-y-8 lg:space-y-0 lg:flex lg:h-fit md:flex-nowrap">
                <div className="w-full space-y-2 gap-2 pt-6 pb-4 lg:pb-0 border-t items-center flex flex-col lg:flex-row lg:space-y-0 lg:w-fit lg:border-l lg:border-t-0 lg:pt-0 lg:pl-2">
                  <Link to={"login"}>
                    <button className="btn variant-ghost sz-sm" type="button">
                      <span className="btn-label">Login</span>
                    </button>
                  </Link>
                  <button className="btn variant-neutral sz-sm" type="button">
                    <span>Sign Up</span>
                  </button>
                </div>
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
