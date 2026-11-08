"""Compose captured original/result pixels into a small documentation GIF and social card."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
original = Image.open(root / '.impeccable/review/demo-original.png').convert('RGB')
result = Image.open(root / '.impeccable/review/demo-result.png').convert('RGB')
original.thumbnail((640, 426)); result = result.resize(original.size)
try:
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
except OSError:
    font = ImageFont.load_default()
frames = []
positions = list(range(0, 101, 10)) + list(range(90, -1, -10))
for percent in positions:
    frame = Image.new('RGB', (640, original.height + 54), '#e9e8fa')
    frame.paste(original, (0, 36))
    seam = round(original.width * percent / 100)
    frame.paste(result.crop((0, 0, seam, result.height)), (0, 36))
    draw = ImageDraw.Draw(frame)
    draw.text((14, 10), 'TOONFORGE  /  LOCAL PHOTO TO PRINT', font=font, fill='#26234c')
    draw.line((seam, 36, seam, original.height + 36), fill='white', width=2)
    draw.text((14, original.height + 39), 'Sample: Green Liu / Unsplash  |  Actual filter output', font=font, fill='#26234c')
    frames.append(frame.quantize(colors=96))
durations = [100] * len(frames); durations[0] = durations[10] = durations[-1] = 900
frames[0].save(root / 'docs/assets/comparison.gif', save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=True,
               comment=b'Actual Toonforge filter output. Sample by Green Liu, Unsplash License. See docs/SOURCES.md.')
card = Image.new('RGB', (1200, 630), '#e9e8fa')
intro = Image.open(root / '.impeccable/review/demo-intro.png').convert('RGB')
intro.thumbnail((1120, 190)); card.paste(intro, (40, 18))
photo = original.resize((600, 400)); processed = result.resize((600, 400))
photo.paste(processed.crop((0, 0, 300, 400)), (0, 0))
card.paste(photo, (40, 210))
draw = ImageDraw.Draw(card)
draw.line((340, 210, 340, 610), fill='white', width=3)
try:
    title = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 29)
    body = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
except OSError:
    title = body = font
draw.text((690, 250), 'Your next print starts here.', font=title, fill='#26234c')
for i, line in enumerate(['Local photo filters', 'Image analysis', 'Reusable recipes', 'Optional text direction', 'Free. Open source.']):
    draw.text((690, 320 + i * 46), line, font=body, fill='#615e7c')
card.save(root / 'public/social-preview.png', optimize=True)
print('Created comparison.gif and social-preview.png from captured application pixels.')
