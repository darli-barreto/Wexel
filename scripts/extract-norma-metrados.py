"""Extract the supplied technical standard for traceable catalogue authoring."""
import json
import pathlib
import sys
from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8")

source = pathlib.Path(sys.argv[1])
pdf = PdfReader(source)
pages = [{"page": i + 1, "text": page.extract_text(extraction_mode="layout")} for i, page in enumerate(pdf.pages)]
output = pathlib.Path("tmp/pdfs")
output.mkdir(parents=True, exist_ok=True)
(output / "norma-metrados-pages.json").write_text(json.dumps(pages, ensure_ascii=False), encoding="utf-8")
(output / "norma-metrados.txt").write_text("\n".join(f"\n=== PAGINA {p['page']} ===\n{p['text']}" for p in pages), encoding="utf-8")
print(json.dumps({"pages": len(pdf.pages), "metadata": dict(pdf.metadata or {})}, ensure_ascii=False))
print("\n".join(p["text"] for p in pages[:7]))
