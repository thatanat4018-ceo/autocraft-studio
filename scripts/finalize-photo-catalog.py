"""Apply reviewed naming corrections after photographic generation finishes."""
import json
from pathlib import Path
p=Path('public/catalog/car-models.json'); rows=json.loads(p.read_text()); by={m['id']:m for m in rows}
for id,name in {'model-7642657587399':'Coupe B3 · 1992','model-15681114079610':'S2 Coupe · 1992','model-7647640649927':'210 · classic two-door','model-7639147217095':'Cooper F55 · 5-door · 2018'}.items():
 m=by[id];m['aliases']=list(dict.fromkeys(m.get('aliases',[])+[m['name']]));m['name']=name
by['model-7647640649927']['modelNote']='Classic two-door body shown; exact model-year details are confirmed with the design proof.'
tmp=p.with_suffix('.next.json');tmp.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')));tmp.replace(p)
print('Reviewed model names updated without changing product IDs')
