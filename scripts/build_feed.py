"""Build data/new-premises.json from london-pulse's daily event files on GitHub.

Usage: python3 scripts/build_feed.py [days]   (stdlib only; needs network)
Source: Food Standards Agency FHRS via london-pulse, Open Government Licence v3.0.
"""
import csv, io, json, os, sys, urllib.request
from datetime import date, timedelta

REPO = "cloudcruncher/london-pulse"
RAW = f"https://raw.githubusercontent.com/{REPO}/main/data/events/"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "new-premises.json")
days = int(sys.argv[1]) if len(sys.argv) > 1 else 28


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "trade-lead-check"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def main():
    listing = json.loads(get(f"https://api.github.com/repos/{REPO}/contents/data/events"))
    names = sorted(f["name"] for f in listing if f["name"].endswith(".csv"))[-days:]
    rows = []
    for n in names:
        for r in csv.DictReader(io.StringIO(get(RAW + n))):
            if r["event"] != "new":
                continue
            rows.append({
                "date": r["event_date"], "id": r["fhrsid"], "name": r["name"],
                "type": r["business_type"], "borough": r["authority"], "postcode": r["postcode"],
            })
    rows.sort(key=lambda r: (r["date"], r["name"]), reverse=True)
    out = {
        "as_of": names[-1][:-4] if names else None, "first_day": names[0][:-4] if names else None,
        "source": "Food Standards Agency FHRS via London Pulse", "licence": "Open Government Licence v3.0",
        "count": len(rows), "premises": rows,
    }
    if not rows:
        sys.exit("no rows fetched; leaving the existing feed alone")
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{len(rows)} new premises, {out['first_day']} to {out['as_of']}")


main()
