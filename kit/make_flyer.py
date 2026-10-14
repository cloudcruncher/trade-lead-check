# /// script
# dependencies = ["qrcode"]
# ///
"""Usage: uv run make_flyer.py https://your-live-url  -> flyer.html (A5) and flyer.pdf (via Chrome)"""
import sys, io, subprocess, pathlib, qrcode, qrcode.image.svg
url = sys.argv[1]
img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, border=1)
buf = io.BytesIO(); img.save(buf); svg = buf.getvalue().decode()
html = f"""<!doctype html><html lang="en-GB"><meta charset="utf-8"><style>
@page{{size:A5;margin:0}}body{{margin:0;font:500 15pt/1.35 'Barlow','Avenir Next',Arial,sans-serif;color:#14224f}}
.p{{width:148mm;height:210mm;box-sizing:border-box;padding:14mm 14mm 12mm 22mm;position:relative;
background:repeating-linear-gradient(#fff 0 7.5mm,#c3d0ea 7.5mm 7.8mm)}}
.p:before{{content:'';position:absolute;left:15mm;top:0;bottom:0;width:.6mm;background:#e0525e}}
h1{{font:800 34pt/1 'Barlow Condensed','Arial Narrow',sans-serif;margin:0 0 6mm;background:#fff}}
p{{background:#fff;margin:0 0 4mm}}.q{{width:52mm;height:52mm;background:#fff;padding:2mm;border:.6mm solid #14224f}}
.s{{display:inline-block;font:800 20pt 'Barlow Condensed',sans-serif;color:#c0262d;border:.8mm solid #c0262d;padding:1mm 4mm;transform:rotate(-4deg);margin:2mm 0 6mm}}
small{{background:#fff;font-size:9pt}}</style><div class="p">
<h1>Is Checkatrade, Bark or MyBuilder worth what you pay?</h1>
<p>Type in last month's numbers. Get a straight answer in 30 seconds. Free, nothing saved.</p>
<div class="s">Keep or cancel?</div>
<div class="q">{svg}</div>
<p style="margin-top:4mm">Scan, or go to <b>{url.replace('https://','')}</b></p>
<small>Made by a London developer, not a platform. Estimates only, not financial advice.</small></div></html>"""
out = pathlib.Path(__file__).parent
(out/"flyer.html").write_text(html)
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={out/'flyer.pdf'}",f"file://{out/'flyer.html'}"],capture_output=True)
print("wrote flyer.html, flyer.pdf")
