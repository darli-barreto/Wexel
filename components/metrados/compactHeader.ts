export function compactHeader(label:string){
 const names:Record<string,string>={'Ancho sección (m)':'b sec. (m)','Profundidad (m)':'Prof. (m)','Base del área (m)':'Base (m)','Ancho del área (m)':'Ancho (m)','Factor volumen':'Factor','Caras encofradas':'Caras','Caras × veces':'Caras × v.','Tapas / elem.':'Tapas/elem.','Vol. base (m³)':'V base (m³)','Cantidad directa (m)':'Cant. (m)'};
 return names[label]??label.replace('Largo · dato ','L · ').replace('Ancho · dato ','b · ').replace('Altura · dato ','h · ');
}
export function completeHeader(label:string){
 return ({'Ai (m²)':'Área de la sección inicial (m²).','Af (m²)':'Área de la sección final (m²).','Am (m²)':'Área media de las secciones (m²). Si se ingresan Ai y Af, se calcula como (Ai + Af) / 2.','L (m)':'Distancia entre las secciones (m).','h ent. (m)':'Altura del concreto dentro del vacío de relleno (m).','A cim. (m²)':'Área acumulada en planta de los cimientos (m²), sin duplicar encuentros.','A col. (m²)':'Área real de la sección de columna (m²).'} as Record<string,string>)[label]??label;
}
