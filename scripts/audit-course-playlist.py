"""Inventory the user-supplied public course and check caption availability.
Never bypass login or playback restrictions; no video/audio downloads.
"""
import concurrent.futures
import json
from pathlib import Path
import re
import sys
import tempfile
import urllib.request

html = Path(sys.argv[1]).read_text(encoding='utf8')
data = json.loads(re.search(r'var ytInitialData = (.*?);</script>', html).group(1))
videos = []
def walk(node):
    if isinstance(node, dict):
        v = node.get('lockupViewModel')
        if v and v.get('contentType') == 'LOCKUP_CONTENT_TYPE_VIDEO':
            text = json.dumps(v)
            video_id = v.get('contentId') or re.search(r'"videoId": "([\w-]+)"',text).group(1)
            title = v.get('metadata',{}).get('lockupMetadataViewModel',{}).get('title',{}).get('content','')
            badge = v.get('contentImage',{}).get('thumbnailViewModel',{}).get('overlays',[])
            duration = re.search(r'"text": "(\d+:\d+(?::\d+)?)"',json.dumps(badge))
            videos.append({'id':video_id,'title':title,'duration':duration.group(1) if duration else None,'url':'https://www.youtube.com/watch?v='+video_id})
        for child in node.values(): walk(child)
    elif isinstance(node,list):
        for child in node: walk(child)
walk(data)
videos=list({v['id']:v for v in videos}.values())
def inspect(video):
    try:
        req=urllib.request.Request(video['url'],headers={'User-Agent':'Mozilla/5.0'})
        page=urllib.request.urlopen(req,timeout=20).read().decode('utf8')
        match=re.search(r'(?:var )?ytInitialPlayerResponse\s*=\s*',page)
        if not match:
            return {**video,'captionStatus':'player metadata unavailable'}
        player=json.JSONDecoder().raw_decode(page[match.end():])[0]
        tracks=player.get('captions',{}).get('playerCaptionsTracklistRenderer',{}).get('captionTracks',[])
        status=player.get('playabilityStatus',{})
        transcript = {'status':'not retrieved'}
        track=next((t for t in tracks if t.get('languageCode')=='es'),None)
        if track:
            caption_req=urllib.request.Request(track['baseUrl']+'&fmt=json3',headers={'User-Agent':'Mozilla/5.0'})
            body=urllib.request.urlopen(caption_req,timeout=20).read().decode('utf8')
            if body.strip():
                caption=json.loads(body)
                segments=[{'start':e.get('tStartMs',0)/1000,'text':''.join(s.get('utf8','') for s in e.get('segs',[])).strip()} for e in caption.get('events',[]) if e.get('segs')]
                directory=Path(tempfile.gettempdir())/'wexel-q7-captions'
                directory.mkdir(exist_ok=True)
                (directory/(video['id']+'.json')).write_text(json.dumps(segments,ensure_ascii=False),encoding='utf8')
                transcript={'status':'retrieved','segments':len(segments),'words':sum(len(s['text'].split()) for s in segments)}
            else:
                transcript={'status':'caption endpoint returned an empty response'}
        return {**video,'playability':status.get('status'),'reason':status.get('reason'),
                'description':player.get('videoDetails',{}).get('shortDescription',''),
                'captionStatus':'available' if tracks else 'no accessible caption tracks in public player metadata',
                'tracks':[{'language':t.get('languageCode'),'kind':t.get('kind')} for t in tracks], 'transcript':transcript}
    except Exception as e:
        return {**video,'captionStatus':'request failed','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results=list(pool.map(inspect,videos))
out={'playlist':'https://www.youtube.com/playlist?list=PLgLQ5Nt1OkUrxsvXCQl214qPuKR9queZ3',
     'title':data.get('metadata',{}).get('playlistMetadataRenderer',{}).get('title'),
     'method':'Public playlist and player metadata, no playback bypass or audio transcription.', 'videos':results}
Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(results,ensure_ascii=False))
