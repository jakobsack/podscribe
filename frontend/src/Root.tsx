import { Link, Outlet } from "react-router-dom";

export const Root = () => {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to={"episodes"}>Episodes</Link>
          </li>
          <li>
            <Link to={"Speakers"}>Speakers</Link>
          </li>
        </ul>
      </nav>

      <Outlet />
    </div>
  );
};
