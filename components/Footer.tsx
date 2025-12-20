import React from "react";
import Zoom from "./Zoom";

function Footer() {
  return (
    <div className="flex justify-between h-6 bg-[#dddddd] px-6">
      <div className="flex text-xs text-secondary items-center space-x-4">
        <p>Page 1 0f 1</p>
        <p>0 words</p>
        <p>English (United States)</p>
        <p>Accesibility: Good to go</p>
      </div>
      <Zoom />
    </div>
  );
}

export default Footer;
