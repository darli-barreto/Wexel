"""Build an auditable catalogue from PDF headings, unit tables and measurement paragraphs."""
import collections
import csv
import difflib
import hashlib
import json
import pathlib
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
pages = json.loads(pathlib.Path("tmp/pdfs/norma-metrados-pages.json").read_text(encoding="utf-8"))
source_path = pathlib.Path(sys.argv[1])

def plain(text):
    return "".join(c for c in unicodedata.normalize("NFD", text.upper()) if unicodedata.category(c) != "Mn")

def clean(text):
    return re.sub(r"\s+", " ", text).strip().rstrip(".:;")

head = re.compile(r"^\s*((?:OE|HU)\.\s*\d+(?:\s*\.\s*\d+)*)\.?\s+(.+?)\s*$")
unit_pattern = re.compile(r"METROS?\s+(?:CUADRADOS?|CUBICOS?|LINEALES?)\s*\([^)]*\)|METROS?\s*\([^)]*\)|KILOMETROS?\s*\([^)]*\)|KILOGRAMOS?\s*\([^)]*\)|GLOBAL\s*\([^)]*\)|UNIDAD(?:ES)?\s*\([^)]*\)|PUNTO\s*\([^)]*\)|PAR(?:ES)?\s*\([^)]*\)|JUEGO\s*\([^)]*\)", re.I)

def units(text):
    output=[]
    for match in unit_pattern.finditer(plain(text)):
        phrase=match.group()
        unit = "m2" if "CUADRAD" in phrase else "m3" if "CUBIC" in phrase else "m" if phrase.startswith("METRO") else "km" if phrase.startswith("KILOMETRO") else "kg" if phrase.startswith("KILOGRAM") else "glb" if phrase.startswith("GLOBAL") else "pto" if phrase.startswith("PUNTO") else "par" if phrase.startswith("PAR") else "jgo" if phrase.startswith("JUEGO") else "und"
        if unit not in output: output.append(unit)
    for match in re.finditer(r"\(\s*(M2|M3|M|KM|KG|GLB|UND|PTO|JGO|PAR|H)\.?\s*\)",plain(text)):
        unit=match[1].lower()
        if unit not in output:output.append(unit)
    return output

lines=[]
for page in pages:
    if page["page"]<9: continue
    for line in page["text"].splitlines(): lines.append({"text":line,"page":page["page"]})

oe_body_line=next(i for i,line in enumerate(lines) if line["page"]==20 and re.match(r"^\s*OE\.1\s",line["text"]))
hu_body_line=next(i for i,line in enumerate(lines) if line["page"]==107 and re.match(r"^\s*HU\.1\s",line["text"]))

occurrences=[]
for pos,line in enumerate(lines):
    match=head.match(line["text"])
    if not match: continue
    code=re.sub(r"\s+", "", match[1]).rstrip(".")
    title=match[2].strip()
    row_units=units(title)
    um=unit_pattern.search(plain(title))
    title=title[:um.start()] if um else title
    letters=[c for c in title if c.isalpha()]
    if not letters or (sum(c.isupper() for c in letters)/len(letters)<.83 and not title.lower().startswith("para ") and code not in {"HU.3.3.3.2","HU.3.6.3"}): continue
    # A right-hand unit column is evidence, not part of the heading.
    for following in lines[pos+1:pos+4]:
        extra=following["text"].strip()
        if not extra: break
        if head.match(extra) or not any(c.isalpha() for c in extra): break
        continuation_unit=unit_pattern.search(plain(extra))
        if continuation_unit:
            row_units=list(dict.fromkeys(row_units+units(extra)))
            extra=extra[:continuation_unit.start()].strip()
            if not extra: break
        if re.search(r"UNIDAD|FORMA DE MEDICI|DESCRIPCI",plain(extra)): break
        alpha=[c for c in extra if c.isalpha()]
        if sum(c.isupper() for c in alpha)/len(alpha)<.9: break
        title += " " + extra
    title=clean(title).upper()
    if not title: continue
    body = (pos>=oe_body_line and line["page"]<=104) or pos>=hu_body_line
    # A line such as "OE.3.7.1 PUERTAS" inside a paragraph is a remission, not a
    # second section. Keep the first developed heading and all distinct printed variants.
    if body and any(o["code"]==code and ((o["position"]>=oe_body_line and o["page"]<=104) or o["position"]>=hu_body_line) and (plain(o["title"])==plain(title) or difflib.SequenceMatcher(None,plain(o["title"]),plain(title)).ratio()>.83) for o in occurrences):
        continue
    occurrences.append({"code":code,"title":title,"page":line["page"],"position":pos,"units":row_units})

# The document repeats the OE and HU indices before its developed sections.
first_oe_body=next(x["position"] for x in occurrences if x["page"]==20 and x["code"]=="OE.1")
first_hu_body=next(x["position"] for x in occurrences if x["page"]==107 and x["code"]=="HU.1")
for i,occ in enumerate(occurrences):
    occ["body"] = (first_oe_body<=occ["position"] and occ["page"]<=104) or occ["position"]>=first_hu_body
    end=occurrences[i+1]["position"] if i+1<len(occurrences) else len(lines)
    occ["block"]="\n".join(x["text"].strip() for x in lines[occ["position"]:end]).strip()
    occ["endPage"]=lines[end-1]["page"] if end else occ["page"]

entries=[]
for occ in occurrences:
    matches=[e for e in entries if e["code"]==occ["code"]]
    normalized=plain(occ["title"])
    candidate=next((e for e in matches if plain(e["title"])==normalized),None)
    if not candidate:
        candidate=next((e for e in matches if len(normalized)>12 and (plain(e["title"]).startswith(normalized) or normalized.startswith(plain(e["title"])))),None)
    if not candidate:
        ranked=sorted(((difflib.SequenceMatcher(None,plain(e["title"]),normalized).ratio(),e) for e in matches),key=lambda x:x[0],reverse=True)
        if ranked and ranked[0][0]>.83: candidate=ranked[0][1]
    if not candidate:
        candidate={"id":occ["code"]+("~"+str(len(matches)+1) if matches else ""),"code":occ["code"],"title":occ["title"],"indexPages":[],"bodyPages":[],"options":[],"occurrences":[]}
        entries.append(candidate)
    candidate["occurrences"].append(occ)
    group="bodyPages" if occ["body"] else "indexPages"
    if occ["page"] not in candidate[group]: candidate[group].append(occ["page"])
    for unit in occ["units"]:
        if unit not in candidate["options"]: candidate["options"].append(unit)

by_code=collections.defaultdict(list)
for e in entries: by_code[e["code"]].append(e)
for e in entries:
    bodies=[o for o in e["occurrences"] if o["body"]]
    primary=bodies[0] if bodies else None
    if primary:
        block=primary["block"]
        um=re.search(r"UNIDAD(?:ES)? DE MEDIDA\s*:?(.*?)(?:FORMA DE MEDICI|$)",plain(block),re.S)
        if um:
            e["ownUnits"]=units(um[1])
            for unit in units(um[1]):
                if unit not in e["options"]: e["options"].append(unit)
        e["excerpt"]=block
        fm=re.search(r"FORMA DE MEDICI[OÓ]N\s*:?(.*)",block,re.S|re.I)
        e["measurement"]=clean(fm[1]) if fm else ""
        e["measurementPages"]=list(range(primary["page"],primary["endPage"]+1)) if fm else []
    else: e["excerpt"]=e["measurement"]=""
    parent_code=e["code"].rsplit(".",1)[0]
    candidates=by_code.get(parent_code,[])
    parent=candidates[0] if candidates else None
    # Repeated code in the printed unit table: keep a distinct child, never silently renumber it.
    if len(by_code[e["code"]])>1 and e["title"].startswith("PARA "):
        parent=next((p for p in by_code[e["code"]] if not p["title"].startswith("PARA ")),parent)
    e["parentId"]=parent["id"] if parent else None
    if primary:
        # Shared paragraphs for enumerated variants belong to the enclosing section.
        end=next((o["position"] for o in occurrences if o["body"] and o["position"]>primary["position"] and not o["code"].startswith(e["code"]+".") and o["code"]!=e["code"]),len(lines))
        section="\n".join(x["text"].strip() for x in lines[primary["position"]:end])
        e["sectionUnits"]=units(section)
        fm=re.search(r"FORMA DE MEDICI[OÓ]N\s*\.?\s*:?(.*?)(?=\n\s*(?:OE|HU)\.|\Z)",section,re.S|re.I)
        e["sharedMeasurement"]=clean(fm[1]) if fm else ""
        if fm:
            start_line=section[:fm.start()].count("\n")
            end_line=section[:fm.end()].count("\n")
            e["sharedMeasurementPages"]=sorted(set(x["page"] for x in lines[primary["position"]+start_line:primary["position"]+end_line+1]))
        e["bodyPosition"]=primary["position"]

# Choose the nearest printed parent when the PDF reuses a code for different headings.
for e in entries:
    parents=by_code.get(e["code"].rsplit(".",1)[0],[])
    if len(parents)>1 and "bodyPosition" in e:
        preceding=[p for p in parents if p.get("bodyPosition",10**9)<e["bodyPosition"] and not p["title"].startswith("PARA ")]
        if preceding:e["parentId"]=max(preceding,key=lambda p:p["bodyPosition"])["id"]

entry_by_id={e["id"]:e for e in entries}
for e in entries:
    parent=entry_by_id.get(e["parentId"])
    e["level"]=(parent["level"]+1) if parent and "level" in parent else len(e["code"].split("."))-1
    if not e["measurement"]:
        p=parent
        while p:
            if p["measurement"] or (p.get("sharedMeasurement") and re.search(r"UNIDAD(?:ES)? DE MEDIDA|CONSIDERAMOS SON",plain(p["excerpt"]))):
                e["measurement"]=p["measurement"] or p["sharedMeasurement"]; e["measurementFrom"]=p.get("measurementFrom",p["id"]); break
            break
    e["kind"]="chapter" if any(x["parentId"]==e["id"] for x in entries) else "item"
    if e.get("measurementFrom"):
        origin=entry_by_id[e["measurementFrom"]]
        e["measurementPages"]=origin.get("measurementPages") or origin.get("sharedMeasurementPages",[])
    e["scope"]= ".".join(e["code"].split(".")[:2])
    e["unit"]=e["options"][0] if len(e["options"])==1 and e["kind"]=="item" else ""
    e["ambiguousCode"]=len(by_code[e["code"]])>1
    if not e["options"]:
        p=parent
        while p:
            if len(p.get("sectionUnits",[]))==1 and re.search(r"UNIDAD(?:ES)? DE MEDIDA|CONSIDERAMOS SON",plain(p["excerpt"])):
                e["options"]=p["sectionUnits"][:];e["unitFrom"]=p["id"];break
            break
    e["unit"]=e["options"][0] if len(e["options"])==1 and e["kind"]=="item" else ""
    e["references"]=list(dict.fromkeys(re.findall(r"(?:OE|HU)\.\d+(?:\.\d+)*",e["excerpt"]+" "+e["measurement"])))
    # Consecutive variants followed by one common unit/rule (e.g. OE.3.1.1–14).
    if not e["options"] and e["bodyPages"] and len(plain(clean(e["excerpt"])))<len(plain(clean(e["code"]+" "+e["title"])))+15:
        sibling=next((x for x in entries if x["parentId"]==e["parentId"] and x.get("bodyPosition",0)>e.get("bodyPosition",0) and x["options"]),None)
        if sibling:
            e["options"]=sibling["options"][:];e["unitFrom"]=sibling["id"]
            if not e["measurement"]:e["measurement"]=sibling["measurement"];e["measurementFrom"]=sibling["id"]
            if e.get("measurementFrom")==sibling["id"]:e["measurementPages"]=sibling.get("measurementPages",[])
            if e["kind"]=="item" and len(e["options"])==1:e["unit"]=e["options"][0]
    del e["occurrences"]

# Resolve explicit remissions (e.g. reflectors measured as lamps); never guess a unit.
for _ in range(3):
    for e in entries:
        if e["options"]:continue
        for ref in e["references"]:
            if ref==e["code"]:continue
            if not re.search(r"TODO LO INDICADO|IGUAL A|REFIER|CORRESPOND",plain(e["excerpt"]+" "+e["measurement"])):continue
            targets=by_code.get(ref,[])
            target=next((t for t in targets if len(t["options"])==1),None)
            if target and target["id"]!=e["id"]:
                e["options"]=target["options"][:];e["unitFrom"]=target["id"]
                if e["kind"]=="item":e["unit"]=e["options"][0]
                break

# Editorial corrections checked against the visible PDF tables, with page references.
overrides={
 "OE.2.3.9.3.5":{"title":"PARA VIGUETAS PROPORCIONADAS POR EL FABRICANTE","options":["m"],"unit":"m","editorialNote":"Título recompuesto de la tabla de la página 41; la unidad figura en la columna derecha."},
 "OE.2.3.9.7.1":{"title":"PARA CONCRETO","options":["m3"],"unit":"m3"},
 "OE.2.3.9.7.2":{"title":"PARA ENCOFRADOS","options":["m2"],"unit":"m2"},
 "OE.2.3.9.7.3":{"title":"PARA ARMADURA","options":["kg"],"unit":"kg"},
 "HU.3.2.4.1~2":{"title":"PARA INSTALACIÓN DE LÍNEAS, REDES DEPENDIENDO DE LA ENVERGADURA DE LA OBRA","options":["m","km"],"unit":"","editorialNote":"Unidad de la tabla de la página 120, partida con código repetido en el original."},
 "OE.6.5":{"options":["und"],"unit":"und","editorialNote":"Página 100: Unidad por número de puertos; detallar los puertos del patch panel en el sustento."},
 "OE.5.2.7":{"options":["und"],"unit":"und","unitFrom":"OE.5.2.6","editorialNote":"Página 93: remisión textual a tableros principales (OE.5.2.6)."},
 "OE.3.3.1":{"editorialNote":"Página 60: el PDF dice literalmente «0,25 cm2». Se conserva la transcripción y se exige revisión técnica de esa unidad; la aplicación no sustituye el umbral por otro automáticamente."},
}
for e in entries:
    if e["id"] in overrides:e.update(overrides[e["id"]])
    e.pop("bodyPosition",None)
    e.pop("sectionUnits",None)
    e.pop("sharedMeasurement",None)
    e.pop("sharedMeasurementPages",None)

catalog={"source":{"title":"NORMA TÉCNICA: METRADOS PARA OBRAS DE EDIFICACIÓN Y HABILITACIONES URBANAS","resolution":"R.D. 073-2010/VIVIENDA/VMCS-DNC","pages":len(pages),"sha256":hashlib.sha256(source_path.read_bytes()).hexdigest(),"file":source_path.name},"entries":entries}
output=pathlib.Path("components/metrados/data/norma-catalog.json")
output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
with pathlib.Path("docs/catalogo-partidas-norma.csv").open("w",encoding="utf-8-sig",newline="") as handle:
    writer=csv.writer(handle,delimiter=";")
    writer.writerow(["ID de catálogo","Código del PDF","Nivel","Padre","Tipo","Descripción","Unidad única","Unidades admitidas","Páginas del PDF","Código repetido","Criterio de medición","Nota editorial"])
    for entry in entries:writer.writerow([entry["id"],entry["code"],entry["level"],entry["parentId"] or "","Título / capítulo" if entry["kind"]=="chapter" else "Partida",entry["title"],entry["unit"]," / ".join(entry["options"]),", ".join(map(str,sorted(set(entry["bodyPages"]+entry.get("measurementPages",[]))))),"Sí" if entry["ambiguousCode"] else "No",entry["measurement"],entry.get("editorialNote","")])
report={"entries":len(entries),"byScope":dict(collections.Counter(e["scope"] for e in entries)),"duplicates":[{"code":code,"titles":[e["title"] for e in group]} for code,group in by_code.items() if len(group)>1],"leavesWithoutUnit":[{k:e[k] for k in ["id","title","bodyPages","options"]} for e in entries if e["kind"]=="item" and not e["unit"]],"indexOnly":[e["id"] for e in entries if not e["bodyPages"]]}
pathlib.Path("tmp/pdfs/norma-catalog-audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
