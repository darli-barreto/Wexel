import type { EstimateItem } from '../../store/useMetradoStore';
import { NORMA_BY_ID, normaItemDetailLabel } from './normaCatalog';
import { additionalWorkChoices, missingWorkChoices } from './constructionDetailCatalogue';
import { isCompactedFill } from './crossSections';
import { fillDeductionChoices } from './fillDeductions';
import { isSobrecimientoFormwork } from './sobrecimientoFormwork';

export interface DetailChoice {
  formwork?: boolean;
  id: string; label: string; help: string;
  unit?: string; separateTitle?: string; mode?: 'global' | 'time';
  crossSectionMethod?: 'geometry' | 'endAreas' | 'meanArea';
  fillGroup?: 'footing' | 'gradeBeam' | 'stripFooting';
  columnArea?: boolean;
  sectionElement?: 'column' | 'stripFooting';
  deduction?: boolean;
  surplusBalance?: boolean;
}
type Option = [label: string, help: string];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const choices = (family: string, options: Option[]): DetailChoice[] => options.map(([label, help], i) => ({ id: `${family}:${i}`, label, help }));

// Work identifiers and execution alternatives, not an expansion of the printed normative catalogue.
// Research, source mapping and editing guidance: docs/catalogo-detalles-metrados.md.
function baseDetailChoices(item: EstimateItem): DetailChoice[] {
  if (item.cleanupAreaTemplateVersion) return choices('cleaning-reference', [
    ['Área de intervención (referencia) · sector', 'Área geométrica previa a las eliminaciones; no genera otra partida cobrable.'],
    ['Área de intervención (referencia) · entre ejes', 'Identificar los ejes y medir largo × ancho en metros.'],
  ]);
  const entry = item.norma ? NORMA_BY_ID.get(item.norma.id) : undefined;
  const title = entry?.title ?? item.description, own = normalize(title);
  const ancestors: string[] = [];
  let parent = entry?.parentId ? NORMA_BY_ID.get(entry.parentId) : undefined;
  while (parent) { ancestors.push(parent.title); parent = parent.parentId ? NORMA_BY_ID.get(parent.parentId) : undefined; }
  const context = normalize([title, ...ancestors].join(' · '));
  const pick = (family: string, options: Option[]) => choices(family, options);
  if (own === 'OFICINAS') return pick('offices', [
    ['Oficina de Residencia / Dirección de Obra', 'Ingeniero residente, jefaturas y coordinación técnica.'],
    ['Oficina de Supervisión / Inspección', 'Equipo supervisor, inspector o representantes del cliente.'],
    ['Oficina de Administración y Control', 'Personal, contabilidad, asistencia y control administrativo.'],
    ['Sala de Reuniones / Caseta de Coordinación', 'Coordinación técnica, contratistas y reuniones de obra.'],
    ['Oficina Técnica / Planos y Calidad', 'Planos, documentación técnica y control de calidad.'],
  ]);
  if (own === 'ALMACENES') return pick('storage', [
    ['Almacén de materiales', 'Materiales protegidos según sus condiciones de almacenamiento.'],
    ['Almacén de herramientas y equipos menores', 'Herramientas, repuestos y equipos portátiles.'],
    ['Almacén de cemento y aglomerantes', 'Ambiente seco y protegido de humedad.'],
    ['Almacén administrativo', 'Insumos y documentación de administración.'],
    ['Almacén de productos químicos', 'Ambiente segregado; verificar compatibilidad y especificaciones de seguridad.'],
  ]);
  if (own === 'CASETAS DE GUARDIANIA') return pick('guard', [
    ['Caseta de control de acceso', 'Registro de ingreso de personal y visitantes.'],
    ['Caseta de vigilancia perimetral', 'Puesto de observación en el perímetro de obra.'],
    ['Caseta de control vehicular', 'Ingreso y salida de vehículos y materiales.'],
    ['Caseta de guardianía nocturna', 'Puesto del personal de vigilancia de turno.'],
  ]);
  if (own === 'SERVICIOS HIGIENICOS' || item.detailVariant?.family === 'sanitary') return [
    ...pick('sanitary', [
      ['Servicio higiénico del personal de obra', 'Ambiente provisional construido: medir el área ocupada o techada según el expediente.'],
      ['Servicio higiénico administrativo', 'Ambiente para residencia, administración y supervisión.'],
      ['Servicio higiénico accesible', 'Ambiente con condiciones de accesibilidad definidas en el proyecto.'],
      ['Módulo sanitario prefabricado', 'Si se mide por área, cuantificar el módulo según el alcance del expediente.'],
      ['Duchas y zona de aseo', 'Identificar el ambiente y evitar duplicarlo con otros servicios incluidos.'],
    ]).map(option => ({ ...option, unit: 'm2', separateTitle: 'SERVICIOS HIGIÉNICOS' })),
    { id: 'sanitary:portable-global', label: 'Baño químico portátil · servicio integral', help: 'glb: paquete completo; especifica número de baños, duración, traslado, limpieza y retiro. Separa esta unidad de los m².', unit: 'glb', mode: 'global' as const, separateTitle: 'ALQUILER DE BAÑO QUÍMICO PORTÁTIL · SERVICIO INTEGRAL' },
    { id: 'sanitary:portable-month', label: 'Baño químico portátil · alquiler mensual', help: 'baño-mes: cantidad de baños × meses. Completa cantidad en Elem. simil. y meses en Largo / cantidad.', unit: 'baño-mes', mode: 'time' as const, separateTitle: 'ALQUILER MENSUAL DE BAÑO QUÍMICO PORTÁTIL' },
    { id: 'sanitary:accessible-month', label: 'Baño portátil accesible · alquiler mensual', help: 'baño-mes: unidad accesible por periodo; verifica el alcance de mantenimiento y transporte.', unit: 'baño-mes', mode: 'time' as const, separateTitle: 'ALQUILER MENSUAL DE BAÑO PORTÁTIL ACCESIBLE' },
  ].filter(option => !item.detailVariant || !option.unit || option.unit === item.unit);
  if (own === 'COMEDORES') return pick('dining', [['Comedor del personal de obra', 'Ambiente de alimentación del personal.'], ['Comedor administrativo', 'Ambiente de alimentación de administración y supervisión.'], ['Zona de preparación y distribución de alimentos', 'Identifica las áreas incluidas para no duplicarlas con el comedor.']]);
  if (own === 'VESTUARIOS') return pick('changing', [['Vestuario del personal de obra', 'Ambiente cerrado de cambio de ropa.'], ['Vestuario con casilleros', 'Identifica el área; el equipamiento depende del alcance.'], ['Vestuario por frente de trabajo', 'Ambiente provisional del frente identificado.']]);
  if (own === 'CERCOS') return pick('fence', [['Cerco de paneles de madera', 'Medir con la unidad definida en la partida.'], ['Cerco de malla metálica', 'Identificar tramo, longitud y altura si corresponde.'], ['Cerco de plancha metálica', 'Cerramiento temporal según especificaciones.'], ['Cerco de paneles prefabricados', 'Identificar paños y accesos sin duplicar superficies.']]);
  if (own === 'CARTELES') return pick('sign', [['Cartel de identificación de obra', 'Datos oficiales y dimensiones según expediente.'], ['Cartel informativo de obra', 'Información al público según el alcance de esta partida.'], ['Cartel de acceso a obra', 'Identificación del acceso; las señales de seguridad tienen su partida propia.']]);
  if (/OBTENCION DEL SERVICIO/.test(own)) return pick('water-supply', [['Abastecimiento provisional de agua · conexión', 'Identificar punto de suministro y alcance del servicio.'], ['Abastecimiento provisional de agua · cisterna', 'Precisar punto de entrega y periodo contratado.'], ['Abastecimiento provisional de agua · fuente autorizada', 'Precisar fuente y condiciones del expediente.']]);
  if (/ALMACENAMIENTO Y DISTRIBUCION/.test(own)) return pick('water-storage', [['Tanque de almacenamiento provisional', 'Precisar ubicación, capacidad y elementos incluidos.'], ['Distribución provisional · frente de trabajo', 'Precisar red y puntos servidos.'], ['Punto provisional de abastecimiento', 'Identificar conexión y área atendida.']]);
  if (/CONEXION E INSTALACION|CONSUMO Y MANTENIMIENTO/.test(own)) return pick('temporary-service', [[`${title} · instalación administrativa`, 'Identificar servicio de agua, energía o comunicaciones de las oficinas.'], [`${title} · frente de obra`, 'Precisar servicio y periodo considerado.'], [`${title} · campamento`, 'Identificar instalación temporal y alcance contratado.']]);
  if (/DESAGUE PARA LA CONSTRUCCION/.test(own)) return pick('temporary-drainage', [['Conexión provisional de desagüe', 'Precisar empalme y autorización correspondiente.'], ['Red provisional de evacuación', 'Identificar tramos, puntos y alcance.'], ['Sistema provisional de recolección', 'Solución definida por el proyecto; evitar duplicar el servicio de baños portátiles.']]);
  if (/MOVILIZACION|TRANSPORTE DE MAQUINARIAS/.test(own)) return pick('mobilization', [['Movilización de maquinaria y equipos', 'Precisar equipos, origen y destino.'], ['Movilización de campamento e instalaciones', 'Identificar módulos y elementos transportados.'], ['Desmovilización y retiro de instalaciones', 'Precisar equipos y alcance de retiro.']]);
  if (/APUNTALAMIENTO|TABLAESTACADO|ENTIBADO/.test(own)) return pick('shoring', [[`${title} · frente o tramo`, 'Identificar límites y superficie efectivamente sostenida.'], [`${title} · elemento o estructura`, 'Precisar elemento protegido según diseño temporal.'], [`${title} · zona de cruce`, 'Precisar interferencia y alcance de protección.']]);
  if (/TALA DE ARBOLES|ELIMINACION DE RAICES|ELIMINACION DE ROCAS|ELEMENTOS ENTERRADOS/.test(own)) return pick('obstacles', [[`${title} · elemento identificado`, 'Identificar especie o elemento y ubicación.'], [`${title} · sector`, 'Precisar límites y cantidad o volumen correspondiente.'], [`${title} · interferencia`, 'Identificar interferencia y alcance autorizado de retiro.']]);
  if (/EQUIPOS DE PROTECCION INDIVIDUAL/.test(own)) return pick('ppe', [['Dotación de protección personal · cuadrilla', 'Conjunto definido en el plan de seguridad.'], ['Protección para trabajo en altura', 'Sistema y componentes según la evaluación de riesgos.'], ['Protección respiratoria, auditiva y ocular', 'Tipo y dotación según los riesgos de la tarea.']]);
  if (/PROTECCION COLECTIVA/.test(own)) return pick('collective', [['Barandas y protección de bordes', 'Identificar el frente y alcance.'], ['Protección de vanos y aberturas', 'Identificar cada zona protegida.'], ['Protección de excavaciones y circulación', 'Medidas previstas en el plan de seguridad.']]);
  if (/SENALIZACION|SENALIZACIONES/.test(own)) return pick('safety-sign', [['Señalización preventiva', 'Advertencia de riesgos y áreas de trabajo.'], ['Señalización de obligación y prohibición', 'Acceso, EPP y restricciones del frente.'], ['Señalización de evacuación y emergencia', 'Rutas, salidas y equipos de emergencia.'], ['Señalización temporal de tránsito', 'Identificar desvíos, barreras y control del tránsito.']]);
  if (/CAPACITACION/.test(own)) return pick('training', [['Inducción de seguridad', 'Personal que ingresa a obra.'], ['Charla diaria de seguridad', 'Cuadrilla o frente identificado.'], ['Capacitación de tarea crítica', 'Trabajo en altura, excavaciones u otra tarea prevista en el plan.'], ['Simulacro de emergencia', 'Actividad y participantes según programación.']]);
  if (/EMERGENCIAS/.test(own)) return pick('emergency', [['Recursos de primeros auxilios', 'Dotación prevista en el plan de emergencia.'], ['Recursos contra incendios', 'Equipos y distribución según el proyecto.'], ['Recursos de rescate y evacuación', 'Alcance de la brigada y equipos requeridos.']]);
  if (/TRAZO|REPLANTEO/.test(own)) {
    const options = pick('layout', [['Trazo y replanteo · ejes principales', 'Precisar ejes y sector.'], ['Trazo y replanteo · niveles y cotas', 'Precisar nivel, cota y referencia topográfica.'], ['Trazo y replanteo · frente de trabajo', 'Identificar el tramo o frente.']]);
    if (/PRELIMINAR/.test(own)) options.push(...pick('layout-preliminary', [
      ['Área de trazo preliminar · sector', 'Medir el área del terreno ocupada por el trazo de la primera planta; identificar límites y evitar superposiciones.'],
      ...[1, 2, 3, 4].map(n => [`Zapata Z-${n}`, 'Identificador editable según el plano. Elem. simil. indica cuántas son iguales; largo × ancho define la superficie delimitada. La suma de huellas de zapatas no necesariamente equivale al área total de trazo.'] as Option),
      ['Viga de cimentación · tramo entre ejes', 'Precisar los ejes y medir la superficie del tramo trazado; excluir encuentros ya incluidos en otros detalles.'],
      ['Viga de cimentación · ejes A y C / 1–2', 'Ejemplo editable de ubicación. Ajustar ejes y dimensiones al plano; no repetir áreas de zapatas o encuentros ya medidas.'],
      ['Viga de cimentación · ejes A y C / 2–3', 'Ejemplo editable de ubicación. Definir los límites del tramo sin superposición con el anterior.'],
      ['Cimiento corrido · tramo entre ejes', 'Identificar el tramo y su superficie trazada, descontando encuentros ya incluidos.'],
    ]));
    return options;
  }
  if (/EXCAVACION/.test(own) && !/TABLAESTACADO|PROTECCION/.test(own)) return pick('excavation', [['Excavación · tramo entre ejes', 'Identificar ejes, profundidad y sección real.'], ['Excavación · cimentación', 'Identificar cimiento o zapata.'], ['Excavación · estructura o cámara', 'Precisar elemento, ubicación y dimensiones.']]);
  if (/RELLENO|TERRAPLEN/.test(own)) return pick('fill', [['Relleno y compactación · sector', 'Precisar sector, capas y dimensiones.'], ['Relleno y compactación · zanja', 'Identificar tramo y descuentos de volúmenes ocupados.'], ['Relleno y compactación · cimentación', 'Identificar estructura y volumen neto.']]);
  if (/ELIMINACION.*(?:MATERIAL|DESMONTE|BASURA)/.test(own)) return pick('disposal', [['Retiro de material · frente de trabajo', 'Identificar origen y destino autorizado.'], ['Retiro de material · excavaciones', 'No aplicar esponjamiento sin el criterio del expediente.'], ['Retiro de material · demolición', 'Separar del material de excavación para evitar duplicidad.']]);
  if (/DEMOLICION|REMOCION|DESMONTAJE/.test(own)) return pick('demolition', [['Demolición o retiro · elemento identificado', 'Especificar elemento y ubicación.'], ['Demolición o retiro · tramo', 'Especificar límites del tramo.'], ['Demolición o retiro · ambiente', 'Especificar ambiente y alcance de retiro.']]);
  if (/ELIMINACION DE MALEZA Y ARBUSTOS DE FACIL EXTRACCION/.test(own)) return pick('vegetation-area', [['Superficie con maleza · sector', 'Medir únicamente la vegetación superficial retirada en este sector.'], ['Superficie con maleza · zona de edificación', 'Precisar la zona con vegetación superficial que se elimina.'], ['Superficie con maleza · entre ejes', 'Indicar los ejes iniciales y finales según el plano.']]);
  if (/LIMPIEZA|NIVELACION|NIVELADO|ESCARIFICADO|^CORTES?$|REFINE/.test(own)) return pick('ground', [['Trabajo de terreno · sector', 'Identificar sector y área o volumen correspondiente.'], ['Trabajo de terreno · frente de trabajo', 'Precisar límites del frente.'], ['Trabajo de terreno · tramo entre progresivas', 'Precisar progresiva inicial y final.']]);
  if (/^PARA (?:EL |LA )?(?:CONCRETO|ENCOFRADO|ARMADURA|ACERO)|^CONCRETO$|^ENCOFRADO|^ACERO DE REFUERZO|^CIMIENTOS CORRIDOS$|^SOLADOS$|^FALSOPISO$/.test(own)) {
    const base = normaItemDetailLabel(item, 1).replace(/(?:N-1|[A-Z]+-1)/, '').trim();
    return pick('structure', [[`${base} · elemento según plano`, 'Identificar código del elemento y ejes.'], [`${base} · nivel o tramo`, 'Precisar nivel y límites de la medición.'], [`${base} · descuento de abertura o encuentro`, 'Registrar como descuento solo el volumen o superficie que corresponda.']]);
  }
  if (/PUERTAS|VENTANAS|MAMPARAS|PERSIANAS|CELOSIAS/.test(own)) return pick('joinery', [[`${title} · vano según cuadro`, 'Identificar código y dimensiones del vano.'], [`${title} · ambiente`, 'Identificar ubicación según planos de arquitectura.'], [`${title} · fachada`, 'Identificar fachada y nivel.']]);
  if (/BISAGRAS|CERRADURAS|CERRAJERIA|ACCESORIOS DE CIERRE/.test(own)) return pick('hardware', [['Herraje · puerta o mueble', 'Identificar elemento, tipo y cantidad según cuadro.'], ['Herraje · ambiente', 'Precisar ambiente y alcance.'], ['Herraje · reposición', 'Identificar unidad que se reemplaza.']]);
  if (/PINTURA|TARRAJEO|REVESTIMIENTO|ZOCALO|ENCHAP|MUROS|TABIQUES|SOLAQUEO|ENLUCIDO|EMPASTADO/.test(context) && /^OE\.3/.test(entry?.scope ?? '')) return pick('finish-wall', [[`${title} · ambiente interior`, 'Identificar paño y caras medidas.'], [`${title} · fachada o exterior`, 'Identificar fachada y descontar vanos según el criterio de la partida.'], [`${title} · elemento según plano`, 'Identificar muro, columna, viga u otro elemento aplicable.']]);
  if (/PISOS|PAVIMENT|VEREDAS|CARPETA|SUB-BASE|BASE O AFIRMADO|BERMAS|SARDINELES|CONTRAPISOS/.test(context)) return pick('pavement', [[`${title} · paño o ambiente`, 'Identificar área y espesor si corresponde.'], [`${title} · tramo entre progresivas`, 'Precisar inicio, fin y sección.'], [`${title} · acceso o área exterior`, 'Identificar límites sin duplicar áreas.']]);
  if (/COBERTURA|CIELORRASO|CIELO RASO|CUMBRERA|CANALETAS|BAJANTES/.test(context) && !/OE\.4|OE\.6/.test(entry?.scope ?? '')) return pick('roof', [[`${title} · ambiente`, 'Identificar el ambiente y superficie.'], [`${title} · paño de cubierta`, 'Precisar paño, pendiente y proyección según medición.'], [`${title} · tramo o remate`, 'Precisar límites y encuentros.']]);
  if (/APARATOS SANITARIOS/.test(own)) return pick('fixtures', [['Inodoro', 'Tipo, código y cantidad según cuadro de aparatos.'], ['Lavatorio', 'Tipo, código y cantidad según cuadro de aparatos.'], ['Urinario', 'Tipo y cantidad según plano sanitario.'], ['Ducha', 'Tipo y cantidad según plano sanitario.'], ['Lavadero', 'Tipo y cantidad según plano sanitario.']]);
  if (/VENTILACION|EVACUACION DE HUMOS/.test(own) && /GAS/.test(context)) return pick('gas-ventilation', [['Ventilación inferior · ambiente', 'Identificar rejilla y condiciones previstas en el proyecto de gas.'], ['Ventilación superior · ambiente', 'Identificar rejilla y área libre según diseño.'], ['Evacuación de productos de combustión', 'Identificar artefacto y recorrido del ducto previsto.']]);
  if (/ARTEFACTO/.test(own) && /GAS/.test(context)) return pick('gas-appliance', [['Artefacto a gas · cocina', 'Tipo y condición de instalación o conversión según diseño.'], ['Artefacto a gas · calentador', 'Identificar equipo y sistema de evacuación previsto.'], ['Artefacto a gas · equipo según cuadro', 'Precisar código, potencia y conexión del proyecto.']]);
  if (/GABINETE DE REGULACION|ESTACIONES DE MEDICION/.test(own)) return pick('gas-regulation', [['Conjunto de regulación y medición', 'Identificar estación y componentes incluidos.'], ['Gabinete de regulación · usuario', 'Precisar punto de suministro y tipo previsto.'], ['Conjunto de protección y corte', 'Solo si forma parte del alcance de esta partida.']]);
  if (/ENSAYOS|PRUEBA|PRUEBAS|DESINFECCION/.test(own)) return pick('tests', [[`${title} · tramo o lote`, 'Identificar muestra, lote o tramo ensayado.'], [`${title} · elemento o equipo`, 'Identificar el elemento y protocolo.'], [`${title} · punto de control`, 'Precisar ubicación y criterio de aceptación del expediente.']]);
  if (/VALVULAS/.test(own)) return pick('valves', [['Válvula de cierre o aislamiento', 'Tipo, diámetro y material según plano; no intercambiar especificaciones.'], ['Válvula de retención', 'Identificar sentido del flujo y punto de instalación.'], ['Válvula de control o regulación', 'Precisar función y código del proyecto.'], ['Válvula especial según cuadro', 'Aire, purga, alivio u otra función expresamente especificada.']]);
  if (/ACCESORIOS/.test(own) && /AGUA|DESAGUE|GAS|TUBERIA|INCENDIO/.test(context)) return pick('fittings', [['Codo o cambio de dirección', 'Precisar ángulo, diámetro y material según plano.'], ['Tee o derivación', 'Precisar diámetros y tipo de conexión.'], ['Reducción o transición', 'Precisar diámetros de entrada y salida.'], ['Unión, brida o adaptador', 'Tipo y material según especificación.'], ['Accesorio especial según plano', 'Precisar código y alcance de suministro o instalación.']]);
  if (/TUBERIA|CONDUCTOS|CANALIZACION|REDES|RED DE|RED COLECTORA|RED DE RECOLECCION|RED DE DERIVACION/.test(own)) return pick('networks', [[`${title} · tramo horizontal`, 'Identificar nodos, diámetro, material y longitud.'], [`${title} · montante o tramo vertical`, 'Identificar niveles y altura real.'], [`${title} · acometida o conexión`, 'Precisar origen y destino.'], [`${title} · cruce o empalme`, 'Precisar ubicación y alcance.']]);
  if (/CONDUCTORES|CABLES|CABLE ALIMENTADOR/.test(own)) return pick('cables', [[`${title} · alimentador`, 'Precisar origen, destino, sección y número de conductores.'], [`${title} · circuito o ramal`, 'Identificar circuito según plano.'], [`${title} · montante`, 'Identificar niveles y recorrido.']]);
  if (/SALIDA/.test(own)) {
    if (/COMUNICACION/.test(context)) return pick('comm-outlets', [['Salida de datos', 'Código de punto según plano.'], ['Salida de telefonía', 'Código de punto según plano.'], ['Salida de comunicaciones · servicio según plano', 'Identificar el sistema; no cambiarlo sin el diseño correspondiente.']]);
    if (/ELECTRIC|OE\.5/.test(context + ' ' + (entry?.scope ?? ''))) return pick('power-outlets', [['Salida de alumbrado', 'Código, ambiente y circuito.'], ['Salida de tomacorriente', 'Tipo, código y circuito según planos.'], ['Salida de interruptor', 'Tipo y cantidad según plano.'], ['Salida de fuerza o equipo', 'Equipo y circuito correspondiente.']]);
    return pick('water-outlets', [[`${title} · aparato sanitario`, 'Identificar aparato y ambiente.'], [`${title} · equipo`, 'Identificar equipo y diámetro de conexión.'], [`${title} · punto de servicio`, 'Identificar ubicación y código del punto.']]);
  }
  if (/TABLEROS|TABLERO/.test(own)) return pick('panels', [[`${title} · código según diagrama`, 'Identificar TG, TD u otro código del proyecto.'], [`${title} · sector o nivel`, 'Precisar ubicación y área servida.'], [`${title} · equipo o sistema`, 'Identificar el equipo alimentado o controlado.']]);
  if (/DISPOSITIVOS.*POLARES/.test(own)) return pick('protection', [['Dispositivo de protección · circuito', 'Número de polos y características según diagrama.'], ['Dispositivo de maniobra · equipo', 'Identificar equipo y código del dispositivo.'], ['Dispositivo de control · tablero', 'Identificar tablero y función prevista.']]);
  if (/PUESTA A TIERRA|PARARRAYOS/.test(own)) return pick('earthing', [[`${title} · sistema según plano`, 'Identificar sistema y componentes incluidos.'], [`${title} · electrodo o punto`, 'Precisar ubicación y código.'], [`${title} · enlace o conductor`, 'Precisar trayecto y elementos de conexión incluidos.']]);
  if (/LAMPARAS|REFLECTORES|ALUMBRADO PUBLICO/.test(own)) return pick('lighting', [['Luminaria · ambiente interior', 'Identificar código y tipo según cuadro de luminarias.'], ['Luminaria · área exterior', 'Identificar ubicación y soporte.'], ['Luminaria · circulación o emergencia', 'Solo cuando esté prevista en esta partida y en planos.']]);
  if (/BOMBAS|ELECTROBOMBA|GRUPOS ELECTROGENOS|EQUIPOS|EQUIPAMIENTO|ASCENSORES|MONTAJE/.test(own)) return pick('equipment', [[`${title} · equipo según cuadro`, 'Identificar código, capacidad y ubicación.'], [`${title} · sistema o estación`, 'Precisar el sistema y alcance de suministro o montaje.'], [`${title} · conjunto instalado`, 'Verificar qué accesorios están incluidos para no duplicarlos.']]);
  if (/RACK|PATCH PANEL|ARMARIO|CAJA|CAMARA|BUZON|POSTES/.test(own)) return pick('nodes', [[`${title} · código según plano`, 'Identificar nodo, cámara, caja o soporte.'], [`${title} · tramo o sector`, 'Precisar ubicación en la red.'], [`${title} · conexión o derivación`, 'Precisar servicio y nodos relacionados.']]);
  if (/GRASS|JARDIN|PLANTAS|ARBOLES|SETOS|MACIZOS/.test(own)) return pick('landscape', [[`${title} · área verde`, 'Identificar sector y especie según diseño.'], [`${title} · jardinera o alcorque`, 'Precisar ubicación y dimensiones.'], [`${title} · tramo o alineamiento`, 'Precisar límites y espaciamiento previsto.']]);
  // Every catalogue entry has contextual identifiers; unknown technical variants remain free text.
  const base = normaItemDetailLabel(item, 1).replace(/N-1$/, '').trim();
  return pick('identifier', [[`${base} · sector`, 'Identificar sector y alcance según el expediente.'], [`${base} · frente o tramo`, 'Precisar ubicación y límites de la medición.'], [`${base} · elemento según plano`, 'Precisar código y referencia del elemento.']]);
}

/** Extend the active cell's menu only; never add rows or change existing measurements. */
export function detailChoices(item: EstimateItem): DetailChoice[] {
  const base = baseDetailChoices(item);
  const family = base[0]?.id.split(':')[0] ?? '';
  let selected = base;
  if (family === 'identifier') {
    const entry = item.norma ? NORMA_BY_ID.get(item.norma.id) : undefined;
    const title = entry?.title ?? item.description;
    const ancestors: string[] = [];
    let parent = entry?.parentId ? NORMA_BY_ID.get(entry.parentId) : undefined;
    while (parent) { ancestors.push(parent.title); parent = parent.parentId ? NORMA_BY_ID.get(parent.parentId) : undefined; }
    selected = missingWorkChoices({ title, own: normalize(title), context: normalize([title, ...ancestors].join(' · ')), code: entry?.code ?? item.code, scope: entry?.scope ?? '' }) ?? base;
  }
  const structural = family === 'structure' ? [1, 2, 3, 4].map(ordinal => ({ id: `work:structural-element:${ordinal}`, label: normaItemDetailLabel(item, ordinal), help: 'Identificador editable según planos. Completa las dimensiones y multiplicidades correspondientes a esta partida; no se copian cantidades de otro elemento.' })) : [];
  const seen = new Set<string>();
  const formworkChoices: DetailChoice[] = isSobrecimientoFormwork(item) ? [{ id: 'sobrecimiento:linked-formwork', label: 'Vincular concreto · caras laterales y tapas de extremos', help: 'Reutiliza cantidad, largo y altura del concreto del mismo sobrecimiento. Dos caras laterales; tapas = ancho × altura, con cantidad editable en N.º veces (inicialmente 0). Solo cuenta superficies con encofrado. Conserva detalles manuales: evita duplicarlos con los vinculados. Permite incorporar nuevos tramos del concreto.', formwork: true }] : [];
  const stripFootingChoices: DetailChoice[] = ['m3', 'm³'].includes(item.unit.toLowerCase()) && /\bCIMIENTOS CORRIDOS\b/.test(normalize(item.description)) ? [
    { id: 'strip-footing:area-height', label: 'Cimiento corrido irregular · área en planta × altura', help: 'Volumen de concreto = área real en planta (m²) × altura (m). Introduce la altura en G y el área en H. No dupliques encuentros; si el área incluye varios cimientos, usa cantidad 1. Separa los detalles con alturas distintas.', columnArea: true, sectionElement: 'stripFooting' },
  ] : [];
  const cutSections: DetailChoice[] = (item.norma?.code === 'OE.2.1.3' || /^CORTES?\b/.test(normalize(item.description))) && item.unit === 'm3' ? [
    { id: 'cut-section:endAreas', label: 'Corte · tramo entre progresivas (áreas extremas)', help: 'Activa distancia en G, área inicial en H y área final en I. V=(Ai+Af)/2×L. Las áreas empiezan vacías; no se convierten anchos o alturas previos.', crossSectionMethod: 'endAreas' },
    { id: 'cut-section:meanArea', label: 'Corte · tramo entre progresivas (área media conocida)', help: 'Activa distancia en G y área media en H. V=Am×L. No requiere altura; sustentar el área media con las secciones.', crossSectionMethod: 'meanArea' },
  ] : [];
  const fillSections: DetailChoice[] = (isCompactedFill(item) || /^(?:RELLENOS?|TERRAPLEN)/.test(normalize(item.description))) && ['m3', 'm³'].includes(item.unit.toLowerCase()) ? [
    { id: 'fill-column:area', label: 'Descuento de columna o pedestal · área de sección × altura enterrada', help: 'Para columnas rectangulares, en L, T, circulares u otras formas. Introduce el área real de concreto en m² y solo la altura dentro del vacío de relleno. Conserva el signo del detalle; para descontar usa -1 en N.º de veces.', columnArea: true },
    { id: 'fill-group:footing', label: 'Relleno de zapata · agregar grupo de excavación y descuentos', help: 'Inserta rótulo, excavación, solado, zapata, columna y cimiento corrido. Medidas vacías; descuentos negativos y cantidad vinculada a la excavación. Completa o elimina los descuentos que no correspondan. Si hay datos en el detalle seleccionado, los conserva y agrega el grupo debajo.', fillGroup: 'footing' },
    ...fillDeductionChoices(),
    { id: 'fill-group:gradeBeam', label: 'Relleno de viga de cimentación · agregar grupo', help: 'Inserta excavación y descuentos de VC y tecnopor, cimiento corrido y sobrecimiento enterrado. Medidas vacías, signo negativo y cantidad vinculada a la excavación. Si no hay tecnopor, elige el descuento de VC individual. No repetir encuentros ni descuentos conjuntos e individuales.', fillGroup: 'gradeBeam' },
    { id: 'fill-group:stripFooting', label: 'Relleno de cimiento corrido · agregar grupo', help: 'Inserta excavación, cimiento y sobrecimiento enterrado. Descontar solo la parte dentro del vacío; no el tramo situado sobre el nivel de relleno.', fillGroup: 'stripFooting' },
    { id: 'fill-section:endAreas', label: 'Relleno masivo · tramo entre progresivas (áreas extremas)', help: 'V=(Ai+Af)/2×L. Ai y Af son áreas de relleno compactado en m²; G es distancia en m. No se mide material suelto ni se aplica esponjamiento.', crossSectionMethod: 'endAreas' },
    { id: 'fill-section:meanArea', label: 'Relleno masivo · tramo entre progresivas (área media conocida)', help: 'V=Am×L. Usar el área media compactada sustentada en las secciones, sin mezclar áreas de corte.', crossSectionMethod: 'meanArea' },
    { id: 'fill-section:geometry', label: 'Relleno de zanja o cimentación · volumen geométrico neto', help: 'Largo×ancho×altura del vacío a rellenar. Si partes del volumen excavado, descuenta el volumen ocupado por concreto, tuberías u otras estructuras. No descontarlo otra vez si las dimensiones ya son netas.', crossSectionMethod: 'geometry' },
    { id: 'fill-section:deduction', label: 'Relleno · descuento por volumen ocupado por estructura', help: 'Mide el volumen ocupado con largo×ancho×altura e introduce -1 en N.º de veces. Solo descontar si estaba incluido en el volumen bruto; no se cambia el signo automáticamente.', crossSectionMethod: 'geometry' },
  ] : [];
  const surplusChoices: DetailChoice[] = item.norma?.code === 'OE.2.1.6' && ['m3','m³'].includes(item.unit.toLowerCase()) ? [{ id: 'surplus:balance', label: 'Excedentes · excavación menos relleno propio × 1,25', help: 'Agrega dos líneas vinculadas a las excavaciones y al relleno propio del mismo grupo. Factor editable 1,25. Conserva los detalles existentes; no resta relleno de préstamo ni inventa volúmenes.', surplusBalance: true }] : [];
  return [...formworkChoices, ...stripFootingChoices, ...surplusChoices, ...fillSections, ...cutSections, ...selected, ...structural, ...additionalWorkChoices(family)].filter(option => {
    const label = normalize(option.label).trim();
    if (seen.has(label)) return false;
    seen.add(label); return true;
  });
}

export function detailQuantityHint(item: EstimateItem): string {
  if (isCompactedFill(item)) return 'Relleno neto = excavación menos los elementos dentro del vacío. Los grupos empiezan sin medidas: si la fila ya tiene datos, se conserva y el grupo se agrega debajo. Completa o elimina los descuentos que no correspondan y evita duplicar encuentros.';
  if (item.unit.trim().toLowerCase() === 'glb') return 'Global (glb): describe el paquete contratado y sustenta sus componentes en el APU. No sumes un global por cada casco, señal, sesión o recurso incluido en el mismo paquete. Elegir una opción no rellena cantidades.';
  if (item.norma?.code === 'OE.1.2.1.1') return 'EPP en und: define en el sustento si se mide cada equipo o una dotación completa según el expediente. No sumes una dotación y otra vez sus componentes. El tipo y la cantidad dependen del PSST.';
  return '';
}
