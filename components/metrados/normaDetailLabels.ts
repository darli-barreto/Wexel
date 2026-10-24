import type { EstimateItem } from '../../store/useMetradoStore';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const sentence = (value: string) => {
  const text = value.replace(/\s*·\s*METRADO PROPIO$/i, '').trim().toLocaleLowerCase('es');
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
};

/** Editable identification hints, not normative scopes, quantities or design specifications. */
export function normaDetailLabel(title: string, ancestors: string[], ordinal: number, unit: string): string {
  const own = normalize(title), context = normalize([title, ...ancestors].join(' · '));
  const numbered = (label: string) => `${label} N-${ordinal}`;
  const exact: Record<string, string> = {
    OFICINAS: 'Oficina', ALMACENES: 'Almacén', 'CASETAS DE GUARDIANIA': 'Caseta', COMEDORES: 'Comedor',
    VESTUARIOS: 'Vestuario', 'SERVICIOS HIGIENICOS': 'Servicio higiénico', CERCOS: 'Tramo de cerco', CARTELES: 'Cartel',
  };
  if (own === 'OFICINAS' && ordinal <= 2) return ordinal === 1 ? 'Oficina de Residencia' : 'Oficina de supervisión';
  if (exact[own]) return numbered(exact[own]);
  if (/OBTENCION DEL SERVICIO/.test(own)) return numbered('Servicio provisional · punto de suministro');
  if (/ALMACENAMIENTO Y DISTRIBUCION/.test(own) && /AGUA/.test(context)) return numbered('Almacenamiento y distribución de agua · sector');
  if (/CONEXION E INSTALACION|CONSUMO Y MANTENIMIENTO/.test(own)) {
    const service = /TELEFON|COMUNICACION/.test(context) ? 'comunicación' : /ENERGIA ELECTRICA/.test(context) ? 'energía eléctrica' : 'servicio';
    return numbered(`${/CONSUMO/.test(own) ? 'Consumo y mantenimiento' : 'Conexión e instalación'} de ${service} provisional · sector`);
  }
  if (/PLAN DE SEGURIDAD/.test(own)) return ordinal === 1 ? 'Plan de Seguridad y Salud en el Trabajo' : numbered('Plan de Seguridad y Salud · frente');
  if (/CAPACITACION/.test(own)) return numbered('Capacitación del personal · grupo');
  if (/PROTECCION PERSONAL|PROTECCION INDIVIDUAL/.test(own)) return numbered('EPP · dotación según PSST');
  if (/PROTECCION COLECTIVA/.test(own)) return numbered('Protección colectiva · frente');
  if (/ENSAYOS|PRUEBAS/.test(own)) return numbered(`${sentence(title)} · punto de control`);
  if (/ELIMINACION DE MATERIAL EXCEDENTE/.test(own)) return numbered('Retiro de material excedente · sector');
  if (/ELIMINACION DE MALEZA Y ARBUSTOS DE FACIL EXTRACCION/.test(own)) return numbered('Superficie con maleza · sector');
  if (/LIMPIEZA.*TERRENO/.test(own)) return numbered('Área de intervención (referencia) · sector');
  if (/^EXCAVACION(?:ES)?\b|^ZANJAS$/.test(own)) return numbered('Excavación · tramo entre ejes');
  if (/RELLENO|TERRAPLEN/.test(own)) return numbered('Relleno y compactación · sector');
  if (/LIMPIEZA.*TERRENO|NIVELACION|NIVELADO|CORTE|ESCARIFICADO/.test(own)) return numbered(`${sentence(title)} · sector`);
  if (/TRAZO|REPLANTEO/.test(own)) return numbered('Trazo y replanteo · sector');
  if (/DEMOLICION|REMOCION|DESMONTAJE/.test(own)) return numbered(`${sentence(title)} · elemento`);

  const material = /^(?:PARA (?:EL|LA) )?ENCOFRADO\b/.test(own) ? 'Encofrado y desencofrado' : /^(?:PARA (?:EL|LA) )?ACERO\b/.test(own) ? 'Acero de refuerzo' : /^(?:PARA (?:EL|LA) )?CONCRETO\b/.test(own) ? 'Concreto' : '';
  if (material) {
    const elements: Array<[RegExp, string]> = [
      [/VIGAS DE CIMENTACION/, 'Viga de cimentación VC-'], [/SOBRECIMIENTOS/, 'Tramo de sobrecimiento SC-'],
      [/CIMIENTOS/, 'Tramo de cimiento CC-'], [/ZAPATAS/, 'Zapata Z-'], [/COLUMNAS/, 'Columna C-'],
      [/PLACAS/, 'Placa PL-'], [/VIGAS/, 'Viga V-'], [/LOSAS ALIGERADAS/, 'Paño de losa aligerada LA-'],
      [/LOSAS MACIZAS/, 'Paño de losa maciza LM-'], [/ESCALERAS/, 'Tramo de escalera E-'],
      [/MUROS/, 'Paño de muro M-'], [/CISTERNAS/, 'Cisterna CI-'], [/TANQUES/, 'Tanque T-'],
      [/PILOTES/, 'Pilote P-'], [/CALZADURAS/, 'Calzadura CA-'],
    ];
    const element = elements.find(([pattern]) => pattern.test(context));
    if (element) return `${element[1]}${ordinal} · ${material}`;
    return numbered(`${material} · elemento`);
  }
  const fixtures: Array<[RegExp, string]> = [
    [/PUERTAS/, 'Puerta P-'], [/VENTANAS/, 'Ventana V-'], [/TABLEROS PRINCIPALES|TABLERO DE DISTRIBUCION/, 'Tablero TD-'],
    [/LAMPARAS|LUMINARIAS|REFLECTORES/, 'Luminaria L-'], [/BOMBAS|BOMBA PARA/, 'Bomba B-'],
    [/VALVULAS/, 'Válvula V-'], [/POSTES/, 'Poste P-'], [/BUZONES|BUZON/, 'Buzón BZ-'],
    [/CAMARAS/, 'Cámara CA-'], [/CAJA DE|CAJAS DE/, 'Caja CJ-'], [/APARATOS SANITARIOS/, 'Aparato sanitario AS-'],
    [/RACK/, 'Rack de comunicaciones RC-'], [/PATCH PANEL/, 'Patch panel PP-'],
  ];
  const fixture = fixtures.find(([pattern]) => pattern.test(own));
  if (fixture) return `${fixture[1]}${ordinal}`;
  if (/SALIDA/.test(own)) return numbered(`${sentence(title)} · punto`);
  if (/CABLES|CONDUCTORES|TUBERIA|CANALIZACION|REDES DE|RED DE|CANALETAS|DUCTOS/.test(own)) return numbered(`${sentence(title)} · tramo`);
  if (/PISOS|PAVIMENTOS|VEREDAS|CARPETA ASFALTICA|BASE O AFIRMADO|SUB-BASE/.test(own)) return numbered(`${sentence(title)} · paño`);
  if (/MUROS|TABIQUES|TARRAJEO|REVOQUES|PINTURA|REVESTIMIENTO|ZOCALOS|ENCHAPADO/.test(own)) return numbered(`${sentence(title)} · paño`);
  if (/CIELORRASO|CIELO RASO|COBERTURAS|TECHOS/.test(own)) return numbered(`${sentence(title)} · ambiente`);
  const identifier = unit === 'm' || unit === 'km' ? 'tramo' : unit === 'm2' ? 'paño' : unit === 'm3' ? 'sector' : unit === 'kg' ? 'elemento' : unit === 'glb' ? 'frente de trabajo' : 'componente';
  return numbered(`${sentence(title)} · ${identifier}`);
}

export function nextDetailOrdinal(item: EstimateItem, label: (ordinal: number) => string) {
  const measurements = item.measurements.filter(line => line.presentation !== 'separator');
  const used = new Set(measurements.map(line => line.description));
  let ordinal = measurements.length + 1;
  while (used.has(label(ordinal))) ordinal++;
  return ordinal;
}
