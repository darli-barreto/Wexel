"use client";

import { useState } from "react";
import Navigation, { NavSection } from "./ui/Navigation";
import NavHome from "./header-tools/NavHome";
import NavInsert from "./header-tools/NavInsert";
import NavDraw from "./header-tools/NavDraw";
import NavLayout from "./header-tools/NavLayout";
import NavReferences from "./header-tools/NavPresupuesto";
import NavMailings from "./header-tools/NavMailings";
import NavReview from "./header-tools/NavReview";
import NavView from "./header-tools/NavView";
import NavPresupuesto from "./header-tools/NavPresupuesto";

const TAB_COMPONENTS: Record<NavSection, React.ComponentType> = {
  Home: NavHome,
  Insert: NavInsert,
  Draw: NavDraw,
  Layout: NavLayout,
  Presupuesto: NavPresupuesto,
  Mailings: NavMailings,
  Review: NavReview,
  View: NavView,
};

function Header() {
  const [activeSection, setActiveSection] = useState<NavSection>("Home");

  const ActiveComponent = TAB_COMPONENTS[activeSection] || NavHome;

  return (
    <header className="h-[116px] min-h-[116px] max-h-[116px] w-full p-3 bg-background-primary select-none overflow-hidden flex flex-col justify-between">
      {/* Pestañas superiores */}
      <Navigation
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      {/* Contenedor del Ribbon: altura fija, ancho completo y sin barras de scroll visibles */}
      <div className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <ActiveComponent />
      </div>
    </header>
  );
}

export default Header;