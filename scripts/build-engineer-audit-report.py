"""Build an evidence-based capability audit. Does not modify application projects."""
import json
from pathlib import Path

root=Path(__file__).resolve().parent.parent
out=root/'docs/auditoria-q7'
book=json.loads((out/'libro-ingeniero.json').read_text(encoding='utf8'))
formulas=json.loads((out/'conciliacion-formulas.json').read_text(encoding='utf8'))
course=json.loads((out/'clases-youtube.json').read_text(encoding='utf8'))
main=next(s for s in book['sheets'] if s['name']=='Metrado')
summary=next(s for s in book['sheets'] if s['name']=='RESUMEN')
steel=next(s for s in book['sheets'] if s['name']=='Acero')
by_code={i['code']:i for i in main['items']}
differences=[]
for entry in summary['items']:
    source=by_code.get(entry['code'])
    cell='G'+str(entry['row'])
    value=summary['cells'].get(cell,{}).get('value')
    if source and isinstance(source['total'],(int,float)) and isinstance(value,(int,float)) and abs(source['total']-value)>.0051:
        differences.append({'code':entry['code'],'metradoCell':'P'+str(source['row']),'metrado':source['total'],'resumenCell':cell,'resumen':value})
steel_differences=[]
for entry in steel['items']:
    source=by_code.get(entry['code'])
    value=steel['cells'].get('W'+str(entry['row']),{}).get('value')
    if source and isinstance(source['total'],(int,float)) and isinstance(value,(int,float)) and abs(source['total']-value)>.0051:
        steel_differences.append({'code':entry['code'],'metrado':source['total'],'acero':value})
checks={'summaryTolerance':.0051,'summaryDifferences':differences,'steelDifferences':steel_differences,
        'measurableItems':sum(bool(i['unit']) for i in main['items']),
        'itemsWithSavedTotal':sum(bool(i['unit']) and i['total'] is not None for i in main['items'])}
(out/'controles-cruzados.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

def number(value):
    return 'Pendiente' if value is None else f'{value:.6f}'.rstrip('0').rstrip('.') if isinstance(value,(float,int)) else str(value)
def clean(value):
    return str(value or '').replace('|','/').replace('\n',' ')

lines=['# Partidas del archivo del ingeniero','',
       'Inventario completo de los títulos y partidas de la hoja Metrado. Las unidades y códigos son del proyecto del ingeniero, no una identificación normativa verificada. «Con total guardado» no equivale a metrado completo o aprobado. Las filas pendientes conservan sus datos sin inventar cantidades.','',
       '| Fila original | Código del proyecto | Descripción | Unidad | Total guardado | Evidencia de cálculo |',
       '|---|---|---|---|---|---|']
for index,item in enumerate(main['items']):
    end=main['items'][index+1]['row'] if index+1<len(main['items']) else main['maxRow']+1
    count=sum('formula' in main['cells'].get(col+str(r),{}) for r in range(item['row'],end) for col in 'KLMNOP')
    state=f'{count} fórmulas en su bloque' if item['unit'] else 'Título; sin cantidad propia'
    lines.append(f"| {item['row']} | {clean(item['code'])} | {clean(item['description'])} | {clean(item['unit'])} | {number(item['total']) if item['unit'] else '—'} | {state} |")
(out/'PARTIDAS.md').write_text('\n'.join(lines)+'\n',encoding='utf8')

videos=course['videos']
seconds=sum(sum(int(x)*60**i for i,x in enumerate(v['duration'].split(':')[::-1])) for v in videos if v.get('duration'))
lines=['# Clases identificadas','',f"Lista pública: [{course['title']}]({course['playlist']}). {len(videos)} videos, {seconds//3600} h {(seconds%3600)//60} min según sus duraciones publicadas.",'',
       'Se verificaron los metadatos públicos de reproducción y pistas de subtítulos en español. Las peticiones de texto devolvieron respuestas vacías. No se han obtenido ni estudiado las transcripciones y no se infieren temas por número de clase. No se descargaron videos ni audio.','',
       '| Clase | Video | Duración | Texto hablado |','|---|---|---|---|']
for i,v in enumerate(videos,1):
    retrieved=v.get('transcript',{}).get('status')=='retrieved'
    lines.append(f"| {i} | [{v['title']}]({v['url']}) | {v['duration']} | {'Texto obtenido; pendiente de análisis' if retrieved else 'No obtenido'} |")
(out/'CLASES.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print(json.dumps(checks,ensure_ascii=False))
