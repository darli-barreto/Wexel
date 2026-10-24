import type { DetailChoice } from './detailChoices';

type Example = readonly [label: string, help: string];
export interface DetailContext { own: string; context: string; code: string; scope: string; title: string }
const list = (family: string, examples: readonly Example[]): DetailChoice[] => examples.map(([label, help], index) => ({ id: `work:${family}:${index}`, label, help }));

/** Identifiers for project work, never prescriptions of sizes, quantities or materials. */
const supplements: Record<string, readonly Example[]> = {
  offices: [['Oficina de Seguridad y Salud en el Trabajo', 'Ambiente del equipo de prevención según el proyecto.'], ['Oficina de producción y control de avance', 'Identificar el ambiente temporal y su superficie.']],
  storage: [['Almacén de acero de refuerzo', 'Identificar zona cubierta y alcance; no duplicar patios ya medidos.'], ['Almacén de EPP y suministros de seguridad', 'Ambiente de almacenamiento, separado del suministro de EPP.'], ['Almacén de instalaciones sanitarias y eléctricas', 'Identificar ambiente y superficie ocupada.']],
  guard: [['Caseta de ingreso peatonal', 'Precisar acceso y área de la caseta.'], ['Caseta de ingreso de proveedores', 'Identificar el puesto sin duplicarlo con el control vehicular.']],
  dining: [['Comedor por turno o frente de trabajo', 'Medir el ambiente construido, sin multiplicar su área por cada turno.'], ['Zona de lavado del comedor', 'Solo si su superficie no está incluida en el ambiente ya medido.']],
  changing: [['Vestuario de personal contratista', 'Medir ambientes distintos, no el mismo ambiente por cada usuario.'], ['Vestuario con zona de aseo', 'Precisar límites y evitar duplicidad con servicios higiénicos.']],
  fence: [['Cerco de malla y postes · tramo entre accesos', 'Identificar tramo y unidad de la partida; accesos según expediente.'], ['Cerco de cerramiento provisional · frente de calle', 'Medir el cerramiento previsto, sin cambiar material ni unidad automáticamente.']],
  sign: [['Cartel de obra · acceso principal', 'Identificar dimensiones y ubicación según expediente.'], ['Cartel de obra · frente secundario', 'Solo si corresponde a otro cartel efectivamente previsto.']],
  'water-supply': [['Abastecimiento de agua · punto de conexión a red', 'Precisar autorización y alcance del suministro.'], ['Abastecimiento de agua · frente alejado', 'Definir el servicio sin volver a contar almacenamiento y distribución incluidos.']],
  'water-storage': [['Tanque provisional · zona de mezclado', 'Describir capacidad y alcance según el proyecto.'], ['Distribución provisional · curado y limpieza', 'Definir puntos y periodo; no duplicar redes incluidas en el paquete.']],
  'temporary-service': [['Servicio provisional · taller y almacenes', 'Precisar instalación o consumo según el nombre de la partida.'], ['Servicio provisional · zona de producción', 'Distinguir conexión inicial de consumo y mantenimiento.']],
  'temporary-drainage': [['Evacuación provisional · servicios higiénicos construidos', 'Precisar red y conexión; revisar si existe servicio integral de baños portátiles.'], ['Evacuación provisional · comedor y zona de lavado', 'Identificar otros usos de desagüe que sí necesita la obra.']],
  mobilization: [['Movilización · excavadora y equipo de movimiento de tierras', 'Identificar equipos, trayecto y alcance del traslado.'], ['Movilización · grúa y equipo de izaje', 'Según programación y medios de transporte del proyecto.'], ['Movilización · mezcladora y equipos menores', 'Precisar conjunto incluido, sin duplicar transporte del mismo equipo.']],
  shoring: [['Sostenimiento · zanja junto a edificación existente', 'Dimensiones y solución de sostenimiento según diseño temporal aprobado.'], ['Sostenimiento · cruce con servicios existentes', 'Identificar interferencia y tramo realmente protegido.']],
  obstacles: [['Obstáculo · acceso principal de obra', 'Identificar elemento y ubicación antes de medir.'], ['Obstáculo · interferencia con cimentación', 'Precisar elemento, autorización y unidad del retiro.']],
  ppe: [
    ['EPP · dotación del personal según PSST', 'Precisar si cada unidad representa una dotación o un equipo individual; no sumar ambos alcances.'],
    ['Casco de seguridad', 'Tipo, certificación y cantidad según peligros y dotación del PSST.'],
    ['Gafas de seguridad', 'Protección ocular compatible con la tarea, según evaluación de riesgos.'],
    ['Pantalla o escudo facial', 'Identificar uso previsto y compatibilidad con otros EPP.'],
    ['Guantes de protección', 'Material y prestación según tarea; no asignar un tipo universal.'],
    ['Calzado de seguridad', 'Tipo y condiciones según riesgos; precisar unidad de suministro en el APU.'],
    ['Protección auditiva', 'Selección y dotación según exposición al ruido del PSST.'],
    ['Protección respiratoria', 'Equipo y filtros según evaluación de exposición; no sustituye controles colectivos.'],
    ['Arnés de cuerpo entero y elemento de conexión', 'EPP para el riesgo previsto; no duplicar con sistemas colectivos incluidos en otra partida.'],
    ['Ropa de trabajo y chaleco reflectivo', 'Definir prendas, dotación y reposición según el PSST.'],
    ['EPP para trabajos eléctricos', 'Prestación y compatibilidad según evaluación de riesgos y proyecto.'],
    ['Reposición de EPP según programa', 'Sustentar desgaste y reposiciones sin repetir la dotación ya incluida.'],
  ],
  collective: [['Protección colectiva · conjunto según PSST', 'Describir el paquete global y sus límites; componentes del mismo paquete no son globales adicionales.'], ['Redes de seguridad · frente de trabajo', 'Definir sistema y superficie según diseño de protección.'], ['Tapas y protección de aberturas en losas', 'Identificar aberturas y alcance incluido en el paquete.'], ['Protección de bordes de losa y escaleras', 'Definir frentes y periodo sin duplicar barandas ya incluidas.'], ['Sistema colectivo de línea de vida', 'Diseño, anclajes e instalación según PSST; distinguir del arnés personal.'], ['Delimitación de zonas de izaje y circulación', 'Precisar protección física y separar señales ya incluidas en señalización.']],
  'safety-sign': [['Señalización temporal de seguridad · conjunto de obra', 'Paquete global según plano y PSST; no sumar un global por cada cartel.'], ['Señales de uso obligatorio de EPP', 'Ubicación y dotación dentro del conjunto previsto.'], ['Señales de riesgo eléctrico', 'Identificar tableros y zonas según plano de señalización.'], ['Señales de rutas de evacuación y punto de reunión', 'Ubicaciones según plan de emergencia.'], ['Señalización de excavaciones y desniveles', 'Separar señales de protecciones físicas si tienen otra partida.'], ['Conos, cintas y barreras de señalización', 'Recursos del paquete; precisar reposición y periodo en el sustento.']],
  training: [['Capacitación en seguridad y salud · programa de obra', 'Paquete global del programa; sesiones y asistentes se sustentan, no equivalen cada uno a un global.'], ['Inducción del personal nuevo', 'Temas, asistentes y programación según PSST.'], ['Capacitación para trabajos en altura', 'Programación y contenidos según tareas efectivamente previstas.'], ['Capacitación para excavaciones y zanjas', 'Personal y frentes según riesgos del proyecto.'], ['Capacitación para izaje y maniobras', 'Roles y alcance según plan de trabajo.'], ['Capacitación para trabajos eléctricos', 'Personal competente y tareas previstas.'], ['Capacitación para espacios confinados', 'Solo cuando el proyecto incluye estas tareas y su procedimiento.']],
  emergency: [['Recursos de respuesta a emergencias · conjunto de obra', 'Paquete global según plan de respuesta; evitar contar el paquete y sus componentes otra vez.'], ['Botiquín y recursos de primeros auxilios', 'Dotación según PSST, sin prescribir medicamentos ni tratamientos.'], ['Extintores y recursos contra incendios', 'Tipo, ubicación y dotación según riesgos.'], ['Camilla y recursos de evacuación', 'Según medios y procedimientos del plan de emergencia.'], ['Equipo de rescate para tareas críticas', 'Recursos previstos para las tareas del proyecto.'], ['Medios de comunicación para emergencias', 'Identificar medios, cobertura y alcance del paquete.']],
  excavation: [['Excavación · zapata según plano', 'Identificar Z- y dimensiones de excavación, no únicamente la pieza estructural.'], ['Excavación · viga de cimentación', 'Tramo y sección real; excluir cruces ya contados.'], ['Excavación · cimiento corrido', 'Tramos entre ejes sin duplicar encuentros.'], ['Excavación · cisterna o reservorio', 'Dimensiones de excavación y método conforme al expediente.'], ['Excavación · buzón o cámara', 'Identificar código, sección y profundidad según plano.']],
  fill: [['Relleno · laterales de cimentación', 'Volumen neto después de descontar las estructuras que lo ocupan.'], ['Relleno · cama o entorno de tubería', 'Solo si pertenece al alcance de esta partida; sección según especificación.'], ['Relleno · plataforma interior', 'Límites y espesor compactado según criterio de medición.'], ['Descuento por estructura que ocupa el relleno', 'Usar descuento únicamente para el volumen ya incluido que realmente desplaza relleno.']],
  disposal: [['Retiro de residuos · limpieza inicial', 'Medir residuos reales; no inferir un espesor uniforme solo del área del terreno.'], ['Retiro de excedente · tramo de zanja', 'Volumen y estado según criterio de la partida; evitar aplicar esponjamiento dos veces.'], ['Retiro de excedente · cimentaciones', 'Identificar origen, volumen neto y destino autorizado.']],
  demolition: [['Demolición o retiro · paño de muro', 'Solo cuando el elemento corresponda al título de la partida; identificar paño.'], ['Demolición o retiro · elemento de cubierta', 'Precisar elemento y límites; no incluir materiales ajenos al alcance.'], ['Demolición o retiro · instalación existente', 'Identificar servicio y alcance autorizado antes del retiro.']],
  'vegetation-area': [['Superficie con maleza · acceso a obra', 'Área realmente desbrozada sin superposición.'], ['Superficie con maleza · perímetro de intervención', 'Delimitar la franja según plano, sin sumar otra vez el sector completo.']],
  ground: [['Trabajo de terreno · plataforma de edificación', 'Definir límites y cotas según plano y alcance de la partida.'], ['Trabajo de terreno · acceso de obra', 'Medir la superficie o volumen que corresponda a la unidad vigente.']],
  structure: [['Elemento según plano · primera planta', 'Código del elemento y alcance exclusivo de esta partida: concreto, encofrado o acero.'], ['Elemento según plano · nivel superior', 'Identificar nivel y código sin repetir elementos de otra planta.'], ['Elemento según plano · junta o encuentro', 'Medir únicamente el alcance previsto y excluir intersecciones ya contadas.']],
  joinery: [['Elemento de carpintería · acceso principal', 'Código del cuadro, dimensiones y material según proyecto.'], ['Elemento de carpintería · acceso de servicio', 'Identificar vano y alcance del suministro o instalación.'], ['Elemento de carpintería · ambiente técnico', 'Solo cuando corresponda al tipo previsto en esta partida.']],
  hardware: [['Herraje · puerta de acceso principal', 'Código de puerta y herraje según cuadro, sin duplicar juegos incluidos.'], ['Herraje · ventana o mampara', 'Únicamente si el tipo de herraje de la partida corresponde a este elemento.']],
  'finish-wall': [['Acabado · paño entre ejes', 'Identificar caras y descuentos exigidos por la partida.'], ['Acabado · servicios higiénicos', 'Identificar paños y alturas según planos.'], ['Acabado · caja de escalera', 'Medir superficies reales; evitar repetir encuentros y derrames.']],
  pavement: [['Tramo · acceso principal', 'Identificar progresivas, ancho y unidad de esta partida.'], ['Paño · circulación peatonal', 'Delimitar el área o longitud del elemento previsto.'], ['Tramo · estacionamiento o patio', 'Medir solo el alcance del pavimento o elemento de la partida.']],
  roof: [['Cubierta o cielorraso · bloque principal', 'Identificar paño y criterio de superficie correspondiente.'], ['Cubierta o cielorraso · ampliación o bloque secundario', 'Precisar límites y evitar duplicar remates incluidos.']],
  fixtures: [['Aparato sanitario · baño accesible', 'Seleccionar aparato previsto en planos y cuadro de equipamiento.'], ['Aparato sanitario · servicios del personal', 'Identificar tipo y código; no sustituir el cuadro por una dotación automática.']],
  tests: [['Ensayo o prueba · recepción de materiales', 'Solo cuando la partida contemple ese ensayo; identificar lote y protocolo.'], ['Ensayo o prueba · puesta en servicio', 'Identificar tramo o sistema y criterio de aceptación del expediente.'], ['Ensayo o prueba · repetición autorizada', 'Precisar causa y alcance; no generar ensayos adicionales sin sustento.']],
  layout: [['Trazo y replanteo · bloque principal', 'Precisar nivel, ejes y área según el criterio de la partida.'], ['Trazo y replanteo · bloque secundario', 'Delimitar superficies sin contar sectores superpuestos.']],
  sanitary: [['Módulo sanitario · frente de obra', 'Ambiente previsto por el proyecto; esta descripción conserva la unidad de la partida.'], ['Servicio higiénico · acceso o campamento', 'Identificar ubicación y alcance sin volver a medir un módulo ya incluido.']],
  fittings: [['Accesorio · derivación de red', 'Tipo, material y diámetro según plano; no cambiar las especificaciones por elegir un nombre.'], ['Accesorio · conexión a equipo', 'Identificar equipo y piezas incluidas en el conjunto.'], ['Accesorio · cambio de dirección', 'Pieza prevista en el despiece, sin duplicar la misma conexión en dos tramos.']],
  'gas-appliance': [['Artefacto a gas · código según cuadro', 'Instalación o conversión únicamente conforme al diseño y alcance contratado.'], ['Artefacto a gas · ambiente técnico', 'Identificar código, ubicación y conexiones previstas; no definir potencia por defecto.']],
  'gas-regulation': [['Regulación y medición · acceso al predio', 'Tipo de conjunto y ubicación definidos por diseño autorizado.'], ['Regulación y medición · bloque de usuarios', 'Precisar usuarios atendidos y componentes incluidos sin duplicarlos.']],
  'gas-ventilation': [['Ventilación de gas · ambiente según plano', 'Área libre y posición solo según diseño; elegir el texto no dimensiona la ventilación.'], ['Evacuación de combustión · equipo identificado', 'Únicamente cuando corresponde al título de la partida y al sistema aprobado.']],
  'water-outlets': [['Salida sanitaria · servicios higiénicos', 'Código, aparato y diámetro según proyecto.'], ['Salida sanitaria · cocina o zona de lavado', 'Identificar punto previsto sin duplicar redes ya medidas.']],
  'power-outlets': [['Salida eléctrica · ambiente según plano', 'Código y sistema del punto según proyecto.'], ['Salida eléctrica · equipo identificado', 'Carga y circuito según diseño; no cambiar la capacidad por elegir un texto.']],
  'comm-outlets': [['Salida de comunicaciones · puesto de trabajo', 'Código y tipo de servicio según cuadro de puntos.'], ['Salida de comunicaciones · equipo de red', 'Solo el punto previsto, sin duplicar suministro del equipo.']],
  protection: [['Dispositivo de protección · tablero general', 'Polos, capacidad y coordinación según diseño eléctrico.'], ['Dispositivo de control · equipo identificado', 'Características según diagrama; no sustituir el diseño por valores por defecto.']],
  valves: [['Válvula · ingreso al sistema', 'Identificar tipo y diámetro definidos por el proyecto.'], ['Válvula · sector de distribución', 'Código y nodo según plano, sin repetir conjuntos incluidos.']],
  networks: [['Tramo · entre buzones o cámaras', 'Identificar nodos y longitud conforme al criterio de la partida.'], ['Tramo · ingreso a edificación', 'Diámetro y material según diseño; no modificar por elegir una descripción.'], ['Tramo · distribución por ambiente', 'Definir origen y destino sin duplicar montantes ni ramales.']],
  cables: [['Circuito · alumbrado', 'Identificar circuito, recorrido y sección según diseño.'], ['Circuito · tomacorrientes', 'Longitud y número de conductores según planos y unidad de medición.'], ['Circuito · fuerza y equipos', 'Identificar equipo y recorrido; no proponer capacidad por defecto.']],
  panels: [['Tablero general · TG', 'Identificador editable; características según diagrama unifilar.'], ['Tablero de distribución · TD', 'Código, ubicación y alcance según cuadro de tableros.'], ['Tablero · servicios o equipos especiales', 'Solo el tipo de tablero que comprende esta partida.']],
  earthing: [['Puesta a tierra · tablero principal', 'Configuración y componentes según diseño, no adoptar valores de resistencia por defecto.'], ['Puesta a tierra · equipo o sistema especial', 'Identificar vínculo y alcance sin duplicar el sistema principal.']],
  lighting: [['Luminaria · circulación y escaleras', 'Código, tipo y cantidad según cuadro del proyecto.'], ['Luminaria · patio o acceso exterior', 'Ubicación y soporte definidos en planos.']],
  equipment: [['Equipo · sala técnica', 'Código y alcance según cuadro de equipos.'], ['Equipo · prueba y puesta en servicio incluida', 'No medir aparte si ya forma parte del suministro e instalación contratado.']],
  nodes: [['Nodo o cámara · acceso a la red', 'Código y ubicación según plano.'], ['Nodo o cámara · cambio de dirección', 'Identificar elemento real y evitar repetirlo en tramos contiguos.']],
  landscape: [['Área verde · parque o plaza', 'Límites, especies y densidades según paisajismo del proyecto.'], ['Área verde · berma o separador', 'Identificar tramo y unidad; evitar superponer áreas con jardineras.']],
};

export function additionalWorkChoices(family: string): DetailChoice[] {
  return list(family, supplements[family] ?? []);
}

/** Specific examples for families that previously fell through to generic identifiers. */
export function missingWorkChoices(c: DetailContext): DetailChoice[] | undefined {
  const pick = (family: string, options: Example[]) => list(family, options);
  if (/PLAN DE SEGURIDAD Y SALUD/.test(c.own)) return pick('safety-plan', [
    ['Plan de Seguridad y Salud en el Trabajo', 'Paquete global de elaboración, implementación y administración según expediente y PSST. No duplicar EPP, protección colectiva o capacitación con partidas propias.'],
    ['Elaboración y actualización del PSST', 'Describir el alcance dentro del global, sin sumar otro global si ya está incluido en el plan integral.'],
    ['Implementación y administración del PSST', 'Precisar personal, recursos y periodo del paquete; no duplicar el plan integral.'],
    ['Identificación de peligros y evaluación de riesgos · IPERC', 'Recurso del desarrollo del PSST; sustentar su inclusión sin volver a contar el paquete completo.'],
    ['Procedimientos de trabajo seguro y permisos', 'Según tareas críticas previstas, sin crear cantidades automáticas por formato.'],
    ['Inspecciones y seguimiento de seguridad', 'Alcance y programación dentro de la administración del PSST.'],
    ['Gestión de registros e investigación de incidentes', 'Recursos contemplados por el PSST; no presupone que ocurran accidentes.'],
  ]);
  if (/LADRILLOS|BLOQUES|DOMOS|VIGUETAS/.test(c.own) && c.scope === 'OE.2') return pick('slab-components', [
    [`${c.title} · paño de losa`, 'Identificar el componente de esta partida y el paño según plano; no sumar tipos que no están previstos.'],
    [`${c.title} · borde o encuentro`, 'Contar piezas efectivas según modulación y cuadro del fabricante.'],
    [`${c.title} · abertura o remate`, 'Ajustar modulación y descuentos conforme al diseño; dimensiones y piezas no se autocompletan.'],
    [`${c.title} · nivel superior`, 'Identificar planta y paño; no duplicar piezas ya medidas.'],
  ]);
  if (c.scope === 'OE.2' && /MADERA/.test(c.context)) return pick('timber-structure', [
    [`${c.title} · elemento M-1`, 'Identificador editable; sección, especie y alcance del armado según planos.'],
    [`${c.title} · elemento M-2`, 'Otra pieza realmente prevista; conservar unidad y alcance de esta partida.'],
    [`${c.title} · bloque o módulo`, 'Identificar conjunto y piezas sin duplicar el armado y sus materiales.'],
    [`${c.title} · nivel o cubierta`, 'Ubicar elemento y revisar uniones incluidas en el alcance.'],
  ]);
  if (c.code.startsWith('OE.2.4')) return pick('metal-structure', [
    [`${c.title} · elemento según plano`, 'Código y alcance de fabricación o montaje según la partida.'],
    [`${c.title} · pórtico o eje`, 'Precisar piezas y multiplicidad; no mezclar unidades de peso y conjunto.'],
    [`${c.title} · nave o bloque`, 'Identificar bloque y evitar repetir elementos comunes entre pórticos.'],
    [`${c.title} · encuentro o unión`, 'Solo si se mide en esta partida y no está incluido en el elemento completo.'],
  ]);
  if (/PILOTES|ANCLAJE Y REFUERZO|PREFABRICADAS/.test(c.own)) return pick('special-foundations', [
    [`${c.title} · elemento según plano`, 'Código y alcance del procedimiento establecido por el diseño.'],
    [`${c.title} · eje o sector`, 'Identificar ubicación, cantidad y unidad admitida por la partida.'],
    [`${c.title} · lote de ejecución`, 'Sustentar lote y componentes sin duplicar ensayos o refuerzos incluidos.'],
    [`${c.title} · nivel o frente`, 'Características definidas por el especialista; no asignar capacidades por defecto.'],
  ]);
  if (/JUNTAS|JUNTA ANTISISMICA/.test(c.own)) return pick('joints', [
    ['Junta · tramo entre ejes', 'Tipo, ancho y longitud según plano y unidad de esta partida.'], ['Junta · encuentro de bloques', 'Identificar bloques y sistema previsto.'], ['Junta · perímetro de estructura', 'No repetir tramos comunes ya medidos.'], ['Junta · cambio de paño', 'Solo juntas previstas en planos; no crearlas por el ejemplo.'],
  ]);
  if (/BARANDAS|PASAMANOS|ESCALERAS|CERCOS DE FIERRO|ELEMENTOS METALICOS ESPECIALES/.test(c.own)) return pick('architectural-metalwork', [
    [`${c.title} · acceso principal`, 'Identificar código, recorrido y unidad correspondiente.'], [`${c.title} · escalera o rampa`, 'Precisar nivel y tramo según diseño.'], [`${c.title} · fachada o perímetro`, 'Medir límites sin duplicar encuentros.'], [`${c.title} · bloque secundario`, 'Ubicación y componentes incluidos según expediente.'],
  ]);
  if (/DIVISION|FORRO DE VANOS|MUEBLES|VITRINAS|CLOSET|CORTINAS ENROLLABLES/.test(c.own)) return pick('interior-carpentry', [
    [`${c.title} · ambiente según plano`, 'Código del ambiente y dimensiones de este elemento.'], [`${c.title} · módulo N-1`, 'Identificar módulo y alcance sin duplicar accesorios incluidos.'], [`${c.title} · módulo N-2`, 'Otra unidad o tramo efectivamente previsto.'], [`${c.title} · frente o elevación`, 'Características y despiece según cuadro del proyecto.'],
  ]);
  if (/ESPEJOS|VITRAL|BLOQUES DE VIDRIO|VIDRIOS|CRISTALES/.test(c.own)) return pick('glazing', [
    [`${c.title} · paño según cuadro`, 'Código, tipo y dimensiones según proyecto.'], [`${c.title} · ambiente interior`, 'Identificar ambiente y unidad: pieza o área según partida.'], [`${c.title} · fachada`, 'Identificar nivel y paño sin duplicar carpintería incluida.'], [`${c.title} · remate o pieza especial`, 'Solo piezas contempladas en el cuadro, sin inventar espesores ni prestaciones.'],
  ]);
  if (/ACCESORIOS|SISTEMAS O MECANISMOS/.test(c.own) && c.scope === 'OE.3') return pick('architectural-accessories', [
    [`${c.title} · puerta según cuadro`, 'Aplicar solo si corresponde al sistema de cierre de esta partida.'], [`${c.title} · ventana o mampara`, 'Tipo y código según detalle arquitectónico.'], [`${c.title} · ambiente o mueble`, 'Identificar elemento servido y accesorios incluidos.'], [`${c.title} · conjunto especificado`, 'No duplicar un juego completo y sus componentes.'],
  ]);
  if (/PODIO DE CONCRETO/.test(c.own)) return pick('concrete-base', [['Podio · equipo sanitario', 'Ubicación y volumen de concreto según plano.'], ['Podio · equipo electromecánico', 'Solo si corresponde al alcance de esta partida.'], ['Podio · elemento según detalle', 'Medir volumen real sin contar vacíos.'], ['Podio · bloque de servicios', 'Identificar elemento y evitar duplicar bases ya incluidas.']]);
  if (/ACCESORIOS|ELEMENTOS DE TOMA|ELEMENTOS DE CONTROL|CONEXION DOMICILIARIA|CONEXIONES DOMICILIARIAS|PIEZAS DE UNION|ANCLAJES/.test(c.own) && /OE\.4|HU\.3/.test(c.scope)) return pick('water-network-components', [
    [`${c.title} · nodo según plano`, 'Tipo, diámetro, material y nodo definidos por el diseño.'], [`${c.title} · empalme o derivación`, 'Identificar unión y elementos incluidos sin duplicar juegos.'], [`${c.title} · acometida por predio`, 'Solo cuando corresponde a conexión domiciliaria; identificar predio.'], [`${c.title} · cambio de dirección`, 'Solo componentes previstos y compatibles con esta partida.'],
  ]);
  if (/ESTRUCTURAS HIDRAULICAS|MANTENIMIENTO DEL SERVICIO DE AGUA|BOMBEO DE AGUAS RESIDUALES/.test(c.own)) return pick('hydraulic-services', [
    [`${c.title} · estructura o nodo identificado`, 'Precisar estructura y actividad; no medir el sistema completo si la partida cubre solo un trabajo parcial.'], [`${c.title} · sector de intervención`, 'Definir límites y servicio que debe mantenerse.'], [`${c.title} · etapa programada`, 'Sustentar duración o conjunto según unidad y alcance del expediente.'], [`${c.title} · conexión temporal`, 'Solo si corresponde al servicio de esta partida; no duplicar instalaciones ya medidas.'],
  ]);
  if (/TRANQUERAS|PASES TEMPORALES/.test(c.own)) return pick('temporary-access', [
    ['Paso temporal · acceso peatonal', 'Solo cuando lo incluye esta partida; identificar ubicación y alcance.'], ['Paso temporal · acceso vehicular', 'Dimensiones y solución aprobadas, sin asignarlas por defecto.'], ['Barrera o delimitación · frente de trabajo', 'Identificar recursos de esta partida; no duplicar señalización ya incluida.'], ['Acceso temporal · cruce de zanja', 'Ubicación, periodo y sistema según el proyecto.'],
  ]);
  if (/INSTALACIONES EXPUESTAS/.test(c.own)) return pick('exposed-installations', [
    ['Instalación expuesta · ambiente técnico', 'Canalización y componentes según planos eléctricos.'], ['Instalación expuesta · recorrido en muro', 'Identificar trayecto y unidad de esta partida.'], ['Instalación expuesta · recorrido en techo', 'Precisar soportes y accesorios incluidos sin duplicarlos.'], ['Instalación expuesta · equipo según cuadro', 'Identificar punto servido y alcance de conexión.'],
  ]);
  if (/CABLEADO ESTRUCTURADO/.test(c.own)) return pick('structured-cabling', [
    ['Punto de datos · puesto de trabajo', 'Código del punto y alcance del cableado según plano.'], ['Punto de datos · equipo de red', 'Identificar equipo y enlace; no duplicar suministro del equipo.'], ['Enlace de comunicaciones · entre armarios', 'Solo si forma parte del alcance y unidad de esta partida.'], ['Cableado estructurado · bloque o nivel', 'Definir puntos y recorridos sin contar el bloque y sus puntos otra vez.'],
  ]);
  if (/CONEXION DOMICILIARIA/.test(c.own) && c.scope === 'HU.5') return pick('communications-service', [
    ['Conexión de comunicaciones · predio N-1', 'Identificador editable; punto de distribución y alcance según diseño.'], ['Conexión de comunicaciones · predio N-2', 'Otra acometida realmente prevista, con su unidad definida.'], ['Conexión de comunicaciones · bloque', 'Definir acometidas y elementos incluidos.'], ['Conexión de comunicaciones · acceso a edificio', 'No duplicar la conexión y los componentes del mismo conjunto.'],
  ]);
  if (/GABINETES CONTRA INCENDIO/.test(c.own)) return pick('fire-cabinets', [['Gabinete contra incendio · nivel', 'Código y equipamiento según plano contra incendios.'], ['Gabinete contra incendio · bloque', 'Identificar bloque y ubicación.'], ['Gabinete contra incendio · zona de riesgo', 'Solo ubicación aprobada por el diseño, no definir dotación por defecto.'], ['Gabinete contra incendio · acceso', 'Precisar conjunto y accesorios incluidos.']]);
  if (/ALMACENAMIENTO DE AGUA|ESTRUCTURAS DE ALMACENAMIENTO/.test(c.own)) return pick('water-storage-structure', [['Almacenamiento · cisterna', 'Solo cuando la partida comprende esta estructura y con su unidad definida.'], ['Almacenamiento · reservorio', 'Capacidad, tipo y alcance según proyecto.'], ['Almacenamiento · tanque elevado', 'Identificar conjunto y componentes incluidos.'], ['Almacenamiento · módulo de servicio', 'No duplicar estructuras medidas en concreto, acero u otras partidas.']]);
  if (/POR SEPARADO|COMPONENTES AGRUPADOS|ANALISIS DE PRECIOS DE LA PARTIDA/.test(c.own)) return pick('network-assemblies', [
    [`${c.title} · conjunto según detalle`, 'Respetar la diferencia entre medir componentes por unidad y medir un conjunto global.'], [`${c.title} · nodo o cámara`, 'Identificar nodo, piezas y alcance.'], [`${c.title} · ramal o sector`, 'Delimitar conjunto y no duplicar componentes incluidos.'], [`${c.title} · empalme previsto`, 'Usar exclusivamente el detalle y despiece aprobados.'],
  ]);
  if (/CRUCE|CRUZADAS|ESTRUCTURA DE SOPORTE|PROTECCION EN/.test(c.own)) return pick('utility-crossings', [
    [`${c.title} · cruce identificado`, 'Código y servicio interferido según plano; solución de protección definida por proyecto.'], [`${c.title} · progresiva`, 'Precisar progresiva y longitud o conjunto según unidad.'], [`${c.title} · acceso o vía`, 'Ubicar cruce y límites sin duplicar protección de otro servicio.'], [`${c.title} · nodo o estructura`, 'Identificar estructura y alcance aprobado.'],
  ]);
  if (/POZO|SELLADO ANULAR|SELLADO DEL FONDO|HEXAMETAFOSFATO/.test(c.context) && c.code.startsWith('HU.3.20')) return pick('well-work', [
    [`${c.title} · pozo P-1`, 'Identificador editable; tramo, dosis o duración conforme al diseño y unidad de la partida.'], [`${c.title} · pozo P-2`, 'Otra captación realmente prevista; no asignar profundidad o rendimiento por defecto.'], [`${c.title} · tramo de intervención`, 'Delimitar profundidad inicial y final cuando corresponda.'], [`${c.title} · etapa de ejecución`, 'Solo la actividad descrita en esta partida, sin duplicar el conjunto del pozo.'],
  ]);
  if (/MARCOS Y TAPAS|PARA ESCALERAS/.test(c.own)) return pick('chamber-access', [[`${c.title} · cámara según plano`, 'Identificar cámara, código y unidad de medición.'], [`${c.title} · buzón según plano`, 'Solo si este componente pertenece a la partida.'], [`${c.title} · acceso de mantenimiento`, 'Características según detalle del proyecto.'], [`${c.title} · estructura hidráulica`, 'Evitar duplicar componentes incluidos en el conjunto.']]);
  if (/ZANJAS/.test(c.own)) return pick('service-trenches', [['Zanja · tramo entre nodos', 'Unidad, sección y servicio según título y proyecto.'], ['Zanja · acometida', 'Identificar predio, longitud y límites.'], ['Zanja · cruce de vía', 'No duplicar el tramo y la cruzada medida separadamente.'], ['Zanja · acceso a estructura', 'Precisar nodo y tramo real.']]);
  if (/CONEXION A LA RED|SUBESTACION|SISTEMA|BOMBA|CAMPANAS|PROYECTORES|ESTACIONES DE BOMBEO|INSTALACIONES ESPECIALES|RADIOBASE|ANTENAS/.test(c.own)) return pick('special-systems', [
    [`${c.title} · conjunto según cuadro`, 'Identificar código, prestaciones y alcance exclusivamente del sistema nombrado.'], [`${c.title} · bloque o sector`, 'Precisar área atendida y componentes incluidos.'], [`${c.title} · sala o ubicación técnica`, 'Ubicación según planos, sin dimensionar equipos automáticamente.'], [`${c.title} · etapa de instalación`, 'No duplicar suministro, instalación y puesta en servicio incluidos en el conjunto.'],
  ]);
  if (/TERMINALES|EMPALMES|MANGAS|ANCLAJES|CABLE DE ALIMENTACION/.test(c.own) && /HU\.5|OE\.6/.test(c.scope)) return pick('communications-components', [
    [`${c.title} · nodo de distribución`, 'Código, tipo y capacidad según planos de comunicaciones.'], [`${c.title} · enlace o ramal`, 'Identificar origen y destino.'], [`${c.title} · acometida a usuario`, 'Solo componentes de esta partida; identificar punto de usuario.'], [`${c.title} · poste o cámara`, 'Precisar soporte y componentes incluidos.'],
  ]);
  return undefined;
}
