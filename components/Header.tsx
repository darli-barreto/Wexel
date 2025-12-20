
import Navigation from "./ui/Navigation";
import NavHome from "./header-tools/NavHome";


function Header() {

  return (
    <div className="h-29 p-3 bg-background-primary">
      <Navigation />
      <NavHome />
    </div>
  );
}

export default Header;
