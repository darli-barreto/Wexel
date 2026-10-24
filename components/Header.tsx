"use client";

import Navigation, { NavSection } from "./ui/Navigation";
import NavHome from "./header-tools/NavHome";
import NavPresupuesto from "./header-tools/NavPresupuesto";
import NavDocumentos from "./header-tools/NavDocumentos";
import NavMetrado from "./header-tools/NavMetrado";
import NavDiagnóstico from "./header-tools/NavDiagnóstico";
import NavDiseño from "./header-tools/NavDiseño";
import NavCostos from "./header-tools/NavCostos";
import NavProgramacion from "./header-tools/NavProgramacion";
import { useWexelStore } from "@/store/useWexelStore";
import { commitEdit } from "./utils/excelEditing";
import { useMetradoPreviewStore } from '@/store/useMetradoPreviewStore';


const TAB_COMPONENTS: Record<NavSection, React.ComponentType> = {
  Home: NavHome,
  Diagnóstico: NavDiagnóstico,
  Diseño: NavDiseño,
  Costos: NavCostos,
  Programación: NavProgramacion,
  Documentos: NavDocumentos,
  Metrados: NavMetrado,
  Presupuesto: NavPresupuesto,
};

function Header() {
  const activeSection = useWexelStore((state) => state.activeSection) as NavSection;
  const setActiveSection = useWexelStore((state) => state.setActiveSection);
  const wordFocus = useWexelStore(state => state.activeFocus === 'word');
  const preview = useMetradoPreviewStore(state => state.active);

  const ActiveComponent = TAB_COMPONENTS[activeSection] || NavHome;

  return (
    <header className="h-29 min-h-29 max-h-29 w-full p-3 bg-background-primary select-none overflow-hidden flex flex-col justify-between">
      {/* Pestañas superiores */}
      <Navigation
        activeSection={activeSection}
        onSelectSection={(section) => { commitEdit(); setActiveSection(section); }}
      />

      {/* Contenedor del Ribbon: altura fija, ancho completo y sin barras de scroll visibles */}
      <div className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <fieldset disabled={activeSection === 'Home' && preview && wordFocus} className="m-0 min-w-0 border-0 p-0" title={preview && wordFocus && activeSection === 'Home' ? 'Vista previa de impresión: aplica el formato a las celdas originales del metrado.' : undefined}>
          <ActiveComponent />
        </fieldset>
      </div>
    </header>
  );
}

export default Header;
