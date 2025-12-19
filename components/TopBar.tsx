import Image from "next/image";
import Toogle from "./ui/Toogle";
import Save from "./topbar-tools/Save";
import Redo from "./topbar-tools/Redo";
import Print from "./topbar-tools/Print";
import Home from "./topbar-tools/Home";
import Repaet from "./topbar-tools/Repeat";
import Search from "./ui/Search";
import TitleDocument from "./topbar-tools/TitleDocument";

function TopBar() {
  return (
    <div className="flex bg-background-primary justify-between items-center h-9 px-3 ">
      <div className="flex items-center ">
        <div className=" flex space-x-2.25 mr-6">
          <Image src="/icons/circle.svg" alt="circle" width={12} height={12} />
          <Image src="/icons/circle.svg" alt="circle" width={12} height={12} />
          <Image src="/icons/circle.svg" alt="circle" width={12} height={12} />
        </div>
        <div className="flex items-center">
          <p className="text-xs font-medium text-primary mr-1.5">AutoSave</p>
          <Toogle />
          <Home />
          <Redo />
          <Repaet />
          <Print />
          <Save />
        </div>
      </div>
      <TitleDocument />
      <Search />
    </div>
  );
}

export default TopBar;
