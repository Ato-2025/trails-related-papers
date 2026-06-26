#!/usr/bin/env python3
"""
fetch_papers.py  —  build resources.json from ONLY the TRAILS Publications collection.

Source: the public TRAILS Zotero group, restricted to the "TRAILS Publications"
collection (4FF8GQA6) and all of its sub-collections (Year 1/2/3, etc.).
No API key needed.

Assigns papers to framework components two ways:
  1. CURATED (built in below): a hand-picked title -> component mapping.
  2. TAGS (optional): any paper tagged tf:trust-proxies, tf:ai-system, etc.

Outputs:
  - resources.json          (data the diagram reads)
  - trails_publications.txt  (every title in the collection, for re-curating)

Run:  python3 fetch_papers.py
"""

import json
import re
import html
import urllib.request
from collections import defaultdict

GROUP_ID = "5266609"
TARGET_COLLECTION = "4FF8GQA6"   # "TRAILS Publications"
BASE = f"https://api.zotero.org/groups/{GROUP_ID}"
HEADERS = {"User-Agent": "trails-related-papers/0.4", "Zotero-API-Version": "3"}

ALIASES = {
    "trust-proxies": "trustProxies", "trustproxies": "trustProxies", "proxies": "trustProxies",
    "ai-system": "aiSystem", "aisystem": "aiSystem", "ai": "aiSystem",
    "tai-research-team": "taiResearchTeam", "tairesearchteam": "taiResearchTeam", "tai": "taiResearchTeam",
    "trust-institution": "trustInstitution", "trustinstitution": "trustInstitution",
    "trust-intermediaries": "trustIntermediaries", "trustintermediaries": "trustIntermediaries",
    "trust-representatives": "trustRepresentatives", "trustrepresentatives": "trustRepresentatives",
    "trust-public": "trustPublic", "trustpublic": "trustPublic", "public": "trustPublic",
    "trusted-infrastructure": "trustedInfrastructure", "trustedinfrastructure": "trustedInfrastructure", "infrastructure": "trustedInfrastructure",
    "proxies-ai": "e1", "build": "e2", "access": "e2", "support": "e3",
    "rely-on-use": "e4", "interact": "e5", "inform": "e6",
    "stand-in-for": "e7", "participatory": "participatory",
}
ALL_KEYS = ["trustProxies", "aiSystem", "taiResearchTeam", "trustInstitution",
            "trustIntermediaries", "trustRepresentatives", "trustPublic", "trustedInfrastructure",
            "e1", "e2", "e3", "e4", "e5", "e6", "e7", "participatory"]

# Curated mapping - all picks verified to be TRAILS Publications (from the 205-paper collection).
CURATED = {
    "taiResearchTeam": [
        "epistemologies of trust",
        "fuzzy-trace theory as a source of design goals",
        "project managers facilitate interdisciplinary collaboration",
        "ten simple rules for building and maintaining a responsible data science",
        "understanding the tradeoffs of human-ai system architecting",
    ],
    "trustProxies": [
        "how reliable are ai user studies",
        "the impact of explanations on fairness in human-ai decision-making",
        "effort-aware fairness",
        "bring your own data",
        "llm evaluators recognize and favor their own generations",
    ],
    "aiSystem": [
        "propensitybench",
        "robustness of ai-image detectors",
        "coercing llms to do and reveal",
        "llm-check: investigating detection of hallucinations",
        "can requirements engineering be used to manage systemic bias",
    ],
    "trustPublic": [
        "lower artificial intelligence literacy predicts greater ai receptivity",
        "public concerns about ai are getting lost in translation",
        "surveilling suitability",
        "safety perceptions of generative ai conversational agents",
        "how probing for problems and bias affects perceptions",
    ],
    "trustedInfrastructure": [
        "data governance is not ready for ai",
        "data disquiet",
        "democratizing ai: open-source scalable llm training",
        "data governance mapping project",
        "from pixels to prose",
    ],
    "trustIntermediaries": [
        "building trust in ai: a landscape analysis",
        "harmful deepfakes in high school contexts",
        "missing persons: the case of national ai strategies",
        "talking to a brick wall",
        "do ai chatbot firms practice what they preach",
    ],
    "trustRepresentatives": [
        "connecting participatory ai to trustworthy ai",
        "open-source and participatory ai as civic science",
        "applying critical ai literacy within a community-based partnership",
        "meaningful engagement: lessons from canada",
        "intergenerational ai literacy",
    ],
    "trustInstitution": [
        "trust in public health institutions moderates",
        "the age of ai nationalism and its effects",
        "generative ai and democratic culture",
        "empathic engagement with the covid-19 vaccine hesitant",
    ],
}


def get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8")), dict(r.headers)


def all_collections():
    cols, start = [], 0
    while True:
        data, hdr = get(f"{BASE}/collections?format=json&limit=100&start={start}")
        cols.extend(data)
        total = int(hdr.get("Total-Results", len(cols)))
        start += 100
        if start >= total or not data:
            break
    return cols


def target_collection_keys():
    """TARGET_COLLECTION plus every sub-collection beneath it (recursively)."""
    cols = all_collections()
    children = defaultdict(list)
    for c in cols:
        parent = c["data"].get("parentCollection")
        children[parent].append(c["data"]["key"])
    keys, stack = set(), [TARGET_COLLECTION]
    while stack:
        k = stack.pop()
        if k in keys:
            continue
        keys.add(k)
        stack.extend(children.get(k, []))
    return keys


def fetch_collection_items(keys):
    """Top-level items across all target collections, de-duplicated by item key."""
    items, seen = [], set()
    for ck in keys:
        start = 0
        while True:
            data, hdr = get(f"{BASE}/collections/{ck}/items/top?format=json&limit=100&start={start}")
            for it in data:
                if it["key"] not in seen:
                    seen.add(it["key"]); items.append(it)
            total = int(hdr.get("Total-Results", len(data)))
            start += 100
            if start >= total or not data:
                break
    return items


def clean_title(s): return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()
def parse_year(d):
    m = re.search(r"(\d{4})", d or ""); return m.group(1) if m else ""
def format_authors(cr):
    n = [c.get("lastName") or c.get("name", "") for c in cr if c.get("creatorType") == "author"]
    n = [x for x in n if x]
    return (", ".join(n[:3]) + (", et al." if len(n) > 3 else "")) if n else ""
def best_url(d):
    return d.get("url") or ("https://doi.org/" + d["DOI"].strip() if d.get("DOI") else "")
def normalize(tag):
    s = tag.split(":", 1)[1] if ":" in tag else tag
    return re.sub(r"[\s_]+", "-", s.strip().lower())


def keys_for(item):
    d = item["data"]
    title = clean_title(d.get("title", "")); tl = title.lower()
    keys, unknown = set(), []
    for comp, subs in CURATED.items():
        if any(s in tl for s in subs):
            keys.add(comp)
    for tg in d.get("tags", []):
        t = tg.get("tag", "")
        if t.lower().startswith("tf:"):
            slug = normalize(t)
            (keys.add(ALIASES[slug]) if slug in ALIASES else unknown.append(t))
    paper = {"title": title, "authors": format_authors(d.get("creators", [])),
             "year": parse_year(d.get("date", "")), "url": best_url(d), "type": d.get("itemType", "")}
    return keys, paper, unknown


def main():
    print("Finding the TRAILS Publications collection and its sub-collections ...")
    keys = target_collection_keys()
    print(f"  {len(keys)} collection(s) in scope")
    print("Fetching their publications ...")
    items = fetch_collection_items(keys)
    print(f"  {len(items)} unique publications in the TRAILS Publications collection\n")

    # write the full title list so the mapping can be refined to TRAILS pubs
    with open("trails_publications.txt", "w", encoding="utf-8") as f:
        for it in sorted(items, key=lambda x: clean_title(x["data"].get("title", "")).lower()):
            d = it["data"]
            f.write(clean_title(d.get("title", ""))[:160] + "  ||  " +
                    ", ".join(t.get("tag", "") for t in d.get("tags", [])) + "\n")

    buckets, seen, unknown_tags, tagged = defaultdict(list), defaultdict(set), set(), 0
    for it in items:
        ks, paper, unk = keys_for(it)
        unknown_tags.update(unk)
        if ks:
            tagged += 1
        for k in ks:
            sig = (paper["title"], paper["url"])
            if sig not in seen[k]:
                seen[k].add(sig); buckets[k].append(paper)

    resources = {k: sorted(buckets.get(k, []), key=lambda p: p["year"], reverse=True) for k in ALL_KEYS}
    with open("resources.json", "w", encoding="utf-8") as f:
        json.dump(resources, f, indent=2, ensure_ascii=False)

    print(f"Publications mapped to a component: {tagged}\n")
    print("PER COMPONENT:")
    for k in ALL_KEYS:
        if resources[k]:
            print(f"  {len(resources[k]):>3}  {k}")
    empty = [k for k in ALL_KEYS if not resources[k]]
    if empty:
        print("\n  (still empty: " + ", ".join(empty) + ")")
    print("\nWrote resources.json and trails_publications.txt")


if __name__ == "__main__":
    main()
