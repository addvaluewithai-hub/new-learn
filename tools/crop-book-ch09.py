"""Reproduce Chapter 9 crops from upright pdf-12.png … pdf-19.png rasters.

Render the supplied 19-page PDF at 1.5x with PyMuPDF, then rotate 90° CCW.
Question crops deliberately end before the printed worked answers.
"""
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
content = root / 'content/book-guided/physics-ch09'
assets = root / 'apps/platform/public/book-ch09'
(assets / 'reference').mkdir(parents=True, exist_ok=True)
(content / 'reference').mkdir(parents=True, exist_ok=True)

def page_image(page):
    raster = f'pdf-{12 + (page - 134)//2}.png'
    image = Image.open(args.rasters / raster).convert('RGB')
    w, h = image.size
    box = [0, 0, round(.54*w), h] if page % 2 == 0 else [round(.45*w), 0, w, h]
    return image.crop(box), raster, box

def save(image, target):
    image.thumbnail((1200, 1500))
    encoded = BytesIO()
    image.save(encoded, 'WEBP', quality=88, method=6)
    payload = encoded.getvalue()
    temp = target.with_suffix('.webp.tmp')
    temp.write_bytes(payload)
    temp.replace(target)
    return dict(file=target.name, width=image.width, height=image.height,
                sha256=hashlib.sha256(payload).hexdigest())

# Bands are relative to each printed page. No extra bottom margin for questions.
question_bands = {'P139-Q1': (.585,.09), 'P140-Q2': (.075,.147),
                  'P140-Q3': (.575,.111), 'P141-Q4': (.12,.14),
                  'P145-Q5': (.115,.108), 'P148-Q6': (.075,.145),
                  'P149-Q7': (.07,.19)}
records = {}
for filename in sorted((content / 'pages').glob('*.json')):
    for part in json.loads(filename.read_text()):
        page = part['page']
        image, raster, origin = page_image(page)
        w,h = image.size
        y, height = question_bands.get(part['id'], part['crop'])
        top = max(0, y - (.008 if 'question' in part else .018))
        bottom = min(1, y + height + (0 if 'question' in part else .018))
        x0,x1 = (.075,.98) if page % 2 == 0 else (0,.98)
        crop = [round(x0*w), round(top*h), round(x1*w), round(bottom*h)]
        receipt = save(image.crop(crop), assets / 'reference' / f"{part['id']}.webp")
        receipt.update(page=page, raster=raster,
                       pixelCrop=[crop[0]+origin[0],crop[1],crop[2]+origin[0],crop[3]],
                       focus=[.015,round((y-top)/(bottom-top),5),.97,
                              round(height/(bottom-top),5)],
                       questionOnly='question' in part)
        records[part['id']] = receipt
for label,low,high in [('waves',134,137),('sound',138,141),
                       ('properties',142,145),('doppler',146,149)]:
    subset = {k:v for k,v in records.items() if low <= v['page'] <= high}
    # One manifest per printed page keeps crop receipts reviewable and <300 lines.
    for page in sorted({r['page'] for r in subset.values()}):
        rows = {k:v for k,v in subset.items() if v['page']==page}
        (content / 'reference' / f'{page}.json').write_text(json.dumps(rows,indent=2)+'\n')

figures = {
 'wave-motion': (134,.13,.29,.89,.47),
 'compression': (135,.12,.055,.66,.18),
 'periodic': (135,.23,.505,.67,.64),
 'tuning-left': (136,.46,.11,.89,.56),
 'tuning-right': (137,.25,.11,.72,.37),
 'hearing': (138,.15,.58,.93,.755),
 'reflection': (142,.52,.28,.90,.73),
 'constructive': (143,.12,.14,.49,.405),
 'destructive-unequal': (143,.13,.425,.51,.61),
 'destructive-equal': (143,.46,.53,.80,.73),
 'firetruck': (146,.26,.285,.87,.51),
 'reflector': (149,.55,.27,.86,.36),
}
figure_records = {}
for name,(page,x0,y0,x1,y1) in figures.items():
    image,raster,origin = page_image(page)
    w,h = image.size
    box = [round(x0*w),round(y0*h),round(x1*w),round(y1*h)]
    receipt = save(image.crop(box), assets / f'{name}.webp')
    receipt.update(page=page,raster=raster,
                   pixelCrop=[box[0]+origin[0],box[1],box[2]+origin[0],box[3]])
    figure_records[name] = receipt
(content / 'figure-assets.json').write_text(json.dumps(figure_records,indent=2)+'\n')
print(f'Extracted {len(records)} source portions and {len(figure_records)} figures.')
