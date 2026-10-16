"""Crop the active chapter portions from the already upright supplied scan rasters."""
import argparse
import hashlib
import json
from io import BytesIO
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--rasters', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
out = root / 'apps/platform/public/book-ch08/reference'
receipts = root / 'content/book-guided/physics-ch08/reference'
out.mkdir(parents=True, exist_ok=True)
receipts.mkdir(parents=True, exist_ok=True)
# Relative vertical ranges in the cropped printed page, matching its taught portion.
focus = {
 'P121-A': (121,.04,.88),
 'P122-A': (122,.13,.28), 'P122-B': (122,.36,.58), 'P122-C': (123,.03,.21),
 'P123-B': (123,.17,.30), 'P123-C': (123,.40,.56),
 'P124-A': (124,.03,.22), 'P124-B': (124,.24,.22), 'P124-C': (124,.40,.53),
 'P125-A': (125,.04,.19), 'P125-B': (125,.22,.43), 'P125-C': (125,.67,.29),
 'P126-A': (126,.03,.39), 'P126-B': (126,.42,.26), 'P126-C': (126,.60,.35),
 'P127-A': (127,.03,.23), 'P127-B': (127,.26,.18), 'P127-C': (127,.46,.17),
 'P127-D': (127,.63,.32), 'P128-A': (128,.03,.49), 'P128-B': (128,.52,.27),
 'P128-C': (128,.72,.24), 'P129-A': (129,.03,.22), 'P129-B': (129,.25,.42),
 'P130-Q1': (130,.03,.25), 'P131-Q2': (131,.03,.61),
 'P132-Q3': (132,.03,.35), 'P133-Q4': (133,.03,.22),
}
records = {}
for section, (page,y,h) in focus.items():
 name = 'title-upright.png' if page == 121 else 'source-0-p1.png' if page in (124,125) else f'ch8-pdf-{6+(page-122)//2}.png'
 raster = args.rasters / name
 image = Image.open(raster).convert('RGB')
 w0,h0 = image.size
 x0,x1 = (0,1) if page == 121 else (0,.54) if page % 2 == 0 else (.45,1)
 pw = (x1-x0)*w0
 top,bottom = max(0,y-.04), min(1,y+h+.05)
 margin = .03 if page % 2 == 0 or page == 121 else 0
 crop = [round(x0*w0+margin*pw), round(top*h0), round(x0*w0+.99*pw), round(bottom*h0)]
 part = image.crop(crop)
 part.thumbnail((1200,1600))
 filename = f'{section}.webp'
 target = out / filename
 encoded = BytesIO()
 part.save(encoded, 'WEBP', quality=88, method=6)
 payload = encoded.getvalue()
 temp = target.with_suffix('.webp.tmp')
 temp.write_bytes(payload)
 temp.replace(target)
 # Highlight the taught band while retaining a little surrounding printed context.
 highlight = [.03, (y-top)/(bottom-top), .94, min(h,1-y)/(bottom-top)]
 records[section] = {
  'page': page, 'file': filename, 'width': part.width, 'height': part.height,
  'focus': [round(v,5) for v in highlight], 'raster': name, 'pixelCrop': crop,
  'sha256': hashlib.sha256(payload).hexdigest(),
 }
for name, rows in [('early',dict(list(records.items())[:15])),('late',dict(list(records.items())[15:]))]:
 (receipts / f'{name}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
print(f'Extracted {len(records)} book portions with crop receipts.')
