"""Compose the column-width scenario figures from the raw panels made by scripts/report_figs.js."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FIG = Path(__file__).resolve().parents[1] / "report" / "figs"
try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
except OSError:
    FONT = None


def labelled(name, text):
    im = Image.open(FIG / name).convert("RGB")
    band = Image.new("RGB", (im.width, 44), "white")
    ImageDraw.Draw(band).text((6, 4), text, fill="black", font=FONT)
    out = Image.new("RGB", (im.width, im.height + 44), "white")
    out.paste(band, (0, 0))
    out.paste(im, (0, 44))
    return out


def stack(parts, out):
    w = max(p.width for p in parts)
    parts = [p.resize((w, round(p.height * w / p.width))) for p in parts]
    im = Image.new("RGB", (w, sum(p.height for p in parts) + 12 * (len(parts) - 1)), "white")
    y = 0
    for p in parts:
        im.paste(p, (0, y))
        y += p.height + 12
    im.save(FIG / out, optimize=True)
    print(out, im.size)


stack([labelled("raw_s1_fixed_loo.png", "(a) Fixed time per machine, leave-one-out"),
       labelled("raw_s1_signal_loo.png", "(b) Signal alarm, level leave-one-out")], "scenario1_col.png")
stack([labelled("raw_s2_v5.png", "V5"), labelled("raw_s2_v6.png", "V6")], "scenario2_col.png")
