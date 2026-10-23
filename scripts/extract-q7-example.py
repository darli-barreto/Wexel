"""Extract the supplied Q7 workbook without running macros or modifying the source."""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path(sys.argv[1])
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(source) as archive:
    strings = ["".join(t.text or "" for t in si.findall(".//s:t", ns)) for si in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", ns)]
    def read(index):
        rows = {}
        for row in ET.fromstring(archive.read(f"xl/worksheets/sheet{index}.xml")).findall("s:sheetData/s:row", ns):
            cells = {}
            for cell in row.findall("s:c", ns):
                value, formula = cell.find("s:v", ns), cell.find("s:f", ns)
                if value is not None and value.text is not None:
                    cells[re.sub(r"\d", "", cell.attrib["r"])] = {"value": strings[int(value.text)] if cell.attrib.get("t") == "s" else value.text, "formula": formula.text if formula is not None else None}
            rows[int(row.attrib["r"])] = cells
        return rows
    main, steel, summary = read(2), read(3), read(4)
    steel_merges = [m.attrib["ref"] for m in ET.fromstring(archive.read("xl/worksheets/sheet3.xml")).findall("s:mergeCells/s:mergeCell", ns) if int(re.search(r"\d+",m.attrib["ref"])[0]) < 17]

def val(row, col, default=""):
    return row.get(col, {}).get("value", default)
def num(row, col, default=1):
    try: return float(val(row, col, str(default)))
    except ValueError: return default

header = {"title": val(main[3], "C"), "project": val(main[6], "D"), "owner": val(main[8], "D"), "date": val(main[9], "D"), "specialty": val(main[10], "D"), "module": val(main[11], "D"), "preparedBy": val(main[8], "M"), "reviewedBy": val(main[9], "M")}
items, codes, controls, notes, special_formulas = [], {}, [], [], {}
current = None
context = ""
for r, cells in main.items():
    if r < 17: continue
    code = val(cells, "C")
    if code and re.fullmatch(r"\d+(?:\.\d+)*", code):
        parent = codes.get(code.rsplit(".", 1)[0]) if "." in code else None
        current = {"id": f"q7-{code}", "parentId": parent, "kind": "item" if val(cells, "E") else "chapter", "code": code, "description": val(cells, "D"), "unit": val(cells, "E"), "order": len(items), "measurements": [], "steelLines": []}
        items.append(current)
        codes[code] = current["id"]
        context = ""
        if "P" in cells: controls.append({"code": code, "sourceCell": f"P{r}", "total": num(cells, "P", 0)})
    if not current or current["kind"] != "item": continue
    unit = val(cells, "E").lower()
    # Rows containing only group labels provide context for following detail rows.
    if not unit:
        if val(cells, "D"): context = val(cells, "D")
        continue
    if unit == "kg" and "N" in cells:
        mass = num(cells, "M", 0)
        diameter = {0.25: ("Ø 1/4″", 6.35), 0.56: ("Ø 3/8″", 9.525), 0.99: ("Ø 1/2″", 12.7), 1.55: ("Ø 5/8″", 15.875)}
        bar, mm = diameter.get(round(mass, 2), ("", 0))
        line = {"id": f"q7-steel-{r}", "description": (context + " · " if context else "") + val(cells, "D"), "bar": bar, "diameterMm": mm, "kgPerMeter": mass, "similarElements": num(cells, "F"), "length": num(cells, "G"), "quantity": num(cells, "J"), "hookStart": num(cells, "H", 0), "hookEnd": 0, "spliceLength": num(cells, "I", 0), "splices": 1 if num(cells, "I", 0) else 0, "weightKg": num(cells, "N", 0)}
        current["steelLines"].append(line)
        continue
    target = {"m": "K", "m2": "L", "m3": "M", "kg": "N", "und": "O"}.get(unit)
    result = target if target in cells else next((col for col in ["K", "L", "M", "N", "O"] if col in cells and re.fullmatch(r"[-+\d.eE]+", val(cells, col))), None)
    if result is None: continue
    # A main partida row may itself contain the quantity (e.g. 12 test specimens).
    if code and result != {"m": "K", "m2": "L", "m3": "M", "kg": "N", "und": "O"}.get(unit): continue
    kind = {"K": "length", "L": "area", "M": "volume", "N": "weight", "O": "units"}[result]
    if unit == "und" and result == "L":
        unit = "pie tablar"
        notes.append({"sourceCell": f"L{r}", "reason": "Cubicado auxiliar de madera separado del total de tijerales en und", "value": num(cells, "L", 0)})
    line = {"id": f"q7-measure-{r}", "description": val(cells, "D") or context, "unit": unit, "kind": kind, "similarElements": num(cells, "F"), "length": num(cells, "G"), "width": num(cells, "H", num(cells, "I")), "height": num(cells, "I"), "repetitions": abs(num(cells, "J")), "sign": -1 if num(cells, "J") < 0 else 1}
    if r in [53, 54]:
        line.update(length=num(cells, "K"), width=num(cells, "L"), height=1)
        special_formulas[line["id"]] = "=G{row}*H{row}"
    if r in [185, 186]:
        line.update(width=num(cells, "L"), height=1)
    if unit == "pie tablar" and r != 331:
        special_formulas[line["id"]] = "=F{row}*G{row}*H{row}*I{row}*J{row}/12/0.3048"
    if kind in ["units", "weight"]:
        line["manualQuantity"] = num(cells, result) / (line["similarElements"] * line["repetitions"] * line["sign"] or 1)
    factor = line["similarElements"] * line["repetitions"] * line["sign"]
    computed = factor * (line.get("manualQuantity", 1) if kind in ["units", "weight"] else line["length"] * (line["width"] if kind in ["area", "volume"] else 1) * (line["height"] if kind == "volume" else 1))
    expected = num(cells, result, 0)
    if abs(computed - expected) > 1e-8:
        # Preserve source results whose inputs use a special layout or a manual value.
        # The user can inspect and edit the explicit override in the native formula bar.
        line["resultRaw"] = str(expected)
        line["quantityOverride"] = expected
        notes.append({"sourceCell": f"{result}{r}", "reason": "Resultado original conservado: cálculo especial o valor manual", "value": expected})
    current["measurements"].append(line)

# The original Acero example has different codes/quantities from main Metrado.
# Keep its cells as an independent reference worksheet, never mix its totals.
reference = {}
for r, cells in steel.items():
    if r > 45: continue
    for col, cell in cells.items():
        if not cell["formula"] and re.fullmatch("=+", cell["value"]): continue
        reference[f"{col}{r}"] = "=" + cell["formula"] if cell["formula"] and "!" not in cell["formula"] else cell["value"]
steel_items, steel_controls = [], []
for r, cells in steel.items():
    if r < 17 or r > 45: continue
    code = val(cells, "C")
    if re.fullmatch(r"\d+(?:\.\d+)*", code):
        steel_items.append({"id": f"q7-sheet-steel-{r}", "parentId": None, "kind": "item", "code": code, "description": val(cells,"D"), "unit": "kg", "order": len(steel_items), "measurements": [], "steelLines": [], "sourceRow": r, "annotations": []})
    if "V" in cells and "F" in cells and steel_items:
        active = next((i for i,col in enumerate("KLMNOPQRST") if col in cells), 0)
        labels = [("Ø 1/4″",6.35),("Ø 3/8″",9.525),("Ø 1/2″",12.7),("Ø 5/8″",15.875),("Ø 3/4″",19.05),("Ø 1″",25.4),("Ø 1 3/8″",34.9),("Ø 6 mm",6),("Ø 8 mm",8),("Ø 12 mm",12)]
        bar, mm = labels[active]
        steel_items[-1]["steelLines"].append({"id": f"q7-sheet-line-{r}", "sourceRow": r, "description": val(cells,"D"), "bar": bar, "diameterMm": mm, "kgPerMeter": num(cells,"U",0), "similarElements": num(cells,"F"), "length": num(cells,"G",0), "quantity": num(cells,"J"), "hookStart": num(cells,"H",0), "hookEnd": 0, "spliceLength": num(cells,"I",0), "splices": 1 if num(cells,"I",0) else 0, "weightKg": num(cells,"V",0)})
    elif not code and val(cells,"D") and steel_items:
        steel_items[-1]["annotations"].append({"row":r,"description":val(cells,"D")})
    for col in "KLMNOPQRSTUVW":
        if col in cells:
            try: steel_controls.append({"cell":f"{col}{r}","value":float(val(cells,col))})
            except ValueError: pass
result = {"source": {"file": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "sheets": ["Metrado", "Acero", "RESUMEN"], "notes": notes}, "header": header, "items": items, "controls": controls, "specialFormulas": special_formulas, "steelReference": reference, "steelItems": steel_items, "steelControls": steel_controls, "steelMerges": steel_merges}
out = Path("components/metrados/data/quispe-example.json")
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"{len(items)} títulos/partidas, {sum(len(i['measurements']) for i in items)} detalles, {sum(len(i['steelLines']) for i in items)} líneas de acero, {len(notes)} valores especiales conservados")
