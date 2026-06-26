#!/usr/bin/env python3
"""
fetch_papers.py  —  build resources.json for the TRAILS trust-framework diagram.

Reads the public TRAILS Zotero group (no API key needed) and collects every
paper tagged with a framework-component tag of the form:

    tf:trust-proxies     tf:ai-system          tf:tai-research-team
    tf:trust-public      tf:trusted-infrastructure   tf:trust-institution
    tf:trust-intermediaries   tf:trust-representatives

(Edges can be tagged too, e.g. tf:proxies-ai, tf:build — optional.)

A paper may carry several tf: tags; it then appears under each component.
Output: resources.json keyed by diagram node/edge id.

Run:  python3 fetch_papers.py
"""

import json
import re
import html
import urllib.request
from collections import defaultdict

GROUP_ID = "5266609"
BASE = f"https://api.zotero.org/groups/{GROUP_ID}"
HEADERS = {"User-Agent": "trails-related-papers/0.2", "Zotero-API-Version": "3"}

# friendly tag slug  ->  diagram id used in TrustNetworkDiagram.jsx
ALIASES = {
    # nodes
    "trust-proxies": "trustProxies", "trustproxies": "trustProxies", "proxies": "trustProxies",
    "ai-system": "aiSystem", "aisystem": "aiSystem", "ai": "aiSystem",
    "tai-research-team": "taiResearchTeam", "tairesearchteam": "taiResearchTeam", "tai": "taiResearchTeam",
    "trust-institution": "trustInstitution", "trustinstitution": "trustInstitution",
    "trust-intermediaries": "trustIntermediaries", "trustintermediaries": "trustIntermediaries",
    "trust-representatives": "trustRepresentatives", "trustrepresentatives": "trustRepresentatives",
    "trust-public": "trustPublic", "trustpublic": "trustPublic", "public": "trustPublic",
    "trusted-infrastructure": "trustedInfrastructure", "trustedinfrastructure": "trustedInfrastructure", "infrastructure": "trustedInfrastructure",
    # edges (optional)
    "proxies-ai": "e1", "build": "e2", "access": "e2", "support": "e3",
    "rely-on-use": "e4", "interact": "e5", "inform": "e6",
    "stand-in-for": "e7", "participatory": "participatory",
}

ALL_KEYS = ["trustProxies", "aiSystem", "taiResearchTeam", "trustInstitution",
            "trustIntermediaries", "trustRepresentatives", "trustPublic", "trustedInfrastructure",
            "e1", "e2", "e3", "e4", "e5", "e6", "e7", "participatory"]


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8")), dict(r.headers)


def fetch_all_items():
    items, start, limit = [], 0, 100
    while True:
        data, hdr = get(f"{BASE}/items/top?format=json&limit={limit}&start={start}")
        items.extend(data)
        total = int(hdr.get("Total-Results", len(items)))
        start += limit
        if start >= total or not data:
            break
    return items


def clean_title(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def parse_year(date):
    m = re.search(r"(\d{4})", date or "")
    return m.group(1) if m else ""


def format_authors(creators):
    names = [c.get("lastName") or c.get("name", "")
             for c in creators if c.get("creatorType") == "author"]
    names = [n for n in names if n]
    if not names:
        return ""
    if len(names) > 3:
        return ", ".join(names[:3]) + ", et al."
    return ", ".join(names)


def best_url(d):
    if d.get("url"):
        return d["url"]
    if d.get("DOI"):
        return "https://doi.org/" + d["DOI"].strip()
    return ""


def normalize(tag):
    # "tf:Trust Proxies" -> "trust-proxies"
    slug = tag.split(":", 1)[1] if ":" in tag else tag
    return re.sub(r"[\s_]+", "-", slug.strip().lower())


def extract(item):
    """Return (list_of_component_keys, paper_dict)."""
    d = item["data"]
    keys, unknown = [], []
    for tg in d.get("tags", []):
        t = tg.get("tag", "")
        if t.lower().startswith("tf:"):
            slug = normalize(t)
            if slug in ALIASES:
                keys.append(ALIASES[slug])
            else:
                unknown.append(t)
    paper = {
        "title": clean_title(d.get("title", "")),
        "authors": format_authors(d.get("creators", [])),
        "year": parse_year(d.get("date", "")),
        "url": best_url(d),
        "type": d.get("itemType", ""),
    }
    return keys, paper, unknown


def main():
    print("Fetching TRAILS Zotero group library ...")
    items = fetch_all_items()
    print(f"  scanned {len(items)} items\n")

    buckets = defaultdict(list)
    unknown_tags = set()
    tagged = 0
    for it in items:
        keys, paper, unknown = extract(it)
        unknown_tags.update(unknown)
        if keys:
            tagged += 1
            for k in keys:
                buckets[k].append(paper)

    # sort each component's papers newest-first
    resources = {k: [] for k in ALL_KEYS}
    for k, papers in buckets.items():
        resources[k] = sorted(papers, key=lambda p: p["year"], reverse=True)

    with open("resources.json", "w") as f:
        json.dump(resources, f, indent=2, ensure_ascii=False)

    print(f"Papers carrying a tf: tag: {tagged}\n")
    print("PER COMPONENT:")
    for k in ALL_KEYS:
        n = len(resources[k])
        if n:
            print(f"  {n:>3}  {k}")
    empty = [k for k in ALL_KEYS if not resources[k]]
    if empty:
        print("\n  (no papers yet for: " + ", ".join(empty) + ")")
    if unknown_tags:
        print("\n  unrecognized tf: tags (fix the tag or add an alias):")
        for t in sorted(unknown_tags):
            print("    " + t)
    print("\nWrote resources.json")


if __name__ == "__main__":
    main()
