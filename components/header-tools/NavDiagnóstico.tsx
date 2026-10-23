import React from "react";
import Saniamiento from "./diagnostico/Saniamiento";
import SeparatorOne from "../ui/SeparatorOne";
import Factibilidad from "./diagnostico/Factibilidad";
import Topografia from "./diagnostico/Topografia";
import Mecanica from "./diagnostico/Mecanica";
import Complementario from "./diagnostico/Complementario";

function NavDiagnóstico() {
  return (
    <div className="flex h-14.5 mt-2.5 items-center min-w-max">
      <Saniamiento />
      <SeparatorOne />
      <Factibilidad />
      <SeparatorOne />
      <Topografia />
      <SeparatorOne />
      <Mecanica />
      <SeparatorOne />
      <Complementario />
    </div>
  );
}

export default NavDiagnóstico;
