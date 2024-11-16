import { Link, Outlet } from "react-router-dom";

export const Root = () => {
  return (
    <>
      <div className="flex flex-row items-stretch align-middle mt-2 bg-green-200">
        <div className="text-lg justify-center p-3 border-r border-green-700">
          Podscribe
        </div>
        <nav className="flex flex-row items-stretch align-middle">
          <Link to={"episodes"} className="p-2 content-center">
            Episodes
          </Link>
          <Link to={"Speakers"} className="p-2 content-center">
            Speakers
          </Link>
        </nav>
      </div>

      <Outlet />
    </>
  );
};
