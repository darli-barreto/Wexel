"""Outline the original Figma labels using the same locally installed font.

Needs fontTools only when regenerating this design artifact, never at app runtime.
Usage: python outline-metrado-labels.py C:/Windows/Fonts/HATTEN.TTF
"""
import json
import sys
from pathlib import Path
if len(sys.argv) > 2:
    sys.path.insert(0, sys.argv[2])
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 6 / font['head'].unitsPerEm
spacing = .12
result = {}
for name, label in [('steel-sheet', 'ACE'), ('worksheet', 'MET')]:
    width = sum(font['hmtx'].metrics[cmap[ord(c)]][0] * scale for c in label) + spacing * (len(label)-1)
    x = 8 - width/2
    # Figma: centered 12 × 6 text box at (2, 8), 6 px Haettenschweiler Regular.
    line_height = (font['hhea'].ascent-font['hhea'].descent) * scale
    baseline = 8 + (6-line_height)/2 + font['hhea'].ascent * scale
    paths = []
    for char in label:
        pen = SVGPathPen(glyphs)
        glyph = cmap[ord(char)]
        glyphs[glyph].draw(TransformPen(pen,(scale,0,0,-scale,x,baseline)))
        paths.append(pen.getCommands())
        x += font['hmtx'].metrics[glyph][0] * scale + spacing
    result[name] = '<path fill="#6DB3DE" stroke="none" d="'+' '.join(paths)+'"/>'
Path('design/metrado-label-outlines.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('ACE y MET convertidos a contornos; no se distribuye la fuente.')
