#!/usr/bin/env python3
"""
fetch_papers.py  —  build resources.json for the TRAILS trust-framework diagram.

Reads the public TRAILS Zotero group (no API key needed) and assigns papers to
framework components two ways:

  1. CURATED (built in below): a hand-picked title -> component mapping, so the
     site is populated out of the box with no Zotero tagging required.
  2. TAGS (optional): any paper tagged in Zotero with a tf: tag, e.g.
     tf:trust-proxies, tf:ai-system, tf:trust-public ...  is also included.

A paper may land under several components. Real URLs/authors/years come straight
from the live library. Output: resources.json keyed by diagram node/edge id.

Run:  python3 fetch_papers.py
"""

import json
import re
import html
import urllib.request
from collections import defaultdict

GROUP_ID = "5266609"
BASE = f"https://api.zotero.org/groups/{GROUP_ID}"
HEADERS = {"User-Agent": "trails-related-papers/0.3", "Zotero-API-Version": "3"}

# friendly tf: tag slug -> diagram id
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

# Curated title -> component mapping (lowercase substrings; verified against the library).
CURATED = {
    "taiResearchTeam": [
        "epistemologies of trust",
        "(re)conceptualizing trustworthy ai",
        "can we make sense of the notion of trustworthy technology",
        "formalizing trust in artificial intelligence",
        "the values encoded in machine learning research",
        "what we talk about when we talk about trust",
    ],
    "trustProxies": [
        "a survey of confidence estimation and calibration",
        "how reliable are ai user studies",
        "stereotyping norwegian salmon",
        "is there a trade-off between fairness and accuracy",
        "psychometric validation of the pailq-6",
    ],
    "aiSystem": [
        "propensitybench",
        "mechanistic interpretability for ai safety",
        "certified adversarial robustness via randomized smoothing",
        "llms know more than they show",
        "balancing safety and helpfulness in healthcare ai",
        "challenges in guardrailing large language models for science",
    ],
    "trustPublic": [
        "how americans view ai and its impact",
        "americans prioritize ai safety and data security",
        "lower artificial intelligence literacy predicts greater ai receptivity",
        "public concerns about ai are getting lost in translation",
        "user attitudes and sources of ai authority in india",
        "trust in automation: integrating empirical evidence",
        "surveilling suitability",
    ],
    "trustedInfrastructure": [
        "data governance is not ready for ai",
        "data disquiet",
        "democratizing ai: open-source scalable llm training",
        "centering racial equity",
        "data governance mapping project",
    ],
    "trustIntermediaries": [
        "nist ai rmp playbook",
        "building trust in ai",
        "detecting dataset bias in medical ai",
        "genai in law: a guide to building trust",
        "harmful deepfakes in high school contexts",
    ],
    "trustRepresentatives": [
        "connecting participatory ai to trustworthy ai",
        "open-source and participatory ai as civic science",
        "applying critical ai literacy within a community-based partnership",
        "meaningful engagement: lessons from canada",
        "intergenerational ai literacy",
    ],
    "trustInstitution": [
        "you don't trust a government vaccine",
        "trust in public health institutions moderates",
        "trust and antitrust",
    ],
}


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
    names = [c.get("lastName") or c.get("name", "") for c in creators if c.get("creatorType") == "author"]
    names = [n for n in names if n]
    if not names:
        return ""
    return ", ".join(names[:3]) + (", et al." if len(names) > 3 else "")


def best_url(d):
    if d.get("url"):
        return d["url"]
    if d.get("DOI"):
        return "https://doi.org/" + d["DOI"].strip()
    return ""


def normalize(tag):
    slug = tag.split(":", 1)[1] if ":" in tag else tag
    return re.sub(r"[\s_]+", "-", slug.strip().lower())


def keys_for(item):
    d = item["data"]
    title = clean_title(d.get("title", ""))
    tl = title.lower()
    keys, unknown = set(), []
    # curated title match
    for comp, subs in CURATED.items():
        if any(s in tl for s in subs):
            keys.add(comp)
    # tf: tags
    for tg in d.get("tags", []):
        t = tg.get("tag", "")
        if t.lower().startswith("tf:"):
            slug = normalize(t)
            if slug in ALIASES:
                keys.add(ALIASES[slug])
            else:
                unknown.append(t)
    paper = {
        "title": title,
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
    seen = defaultdict(set)
    unknown_tags = set()
    tagged = 0
    for it in items:
        keys, paper, unknown = keys_for(it)
        unknown_tags.update(unknown)
        if keys:
            tagged += 1
        for k in keys:
            sig = (paper["title"], paper["url"])
            if sig not in seen[k]:
                seen[k].add(sig)
                buckets[k].append(paper)

    resources = {k: sorted(buckets.get(k, []), key=lambda p: p["year"], reverse=True) for k in ALL_KEYS}

    with open("resources.json", "w", encoding="utf-8") as f:
        json.dump(resources, f, indent=2, ensure_ascii=False)

    print(f"Papers assigned to at least one component: {tagged}\n")
    print("PER COMPONENT:")
    for k in ALL_KEYS:
        if resources[k]:
            print(f"  {len(resources[k]):>3}  {k}")
    empty = [k for k in ALL_KEYS if not resources[k]]
    if empty:
        print("\n  (still empty: " + ", ".join(empty) + ")")
    if unknown_tags:
        print("\n  unrecognized tf: tags:")
        for t in sorted(unknown_tags):
            print("    " + t)
    print("\nWrote resources.json")


if __name__ == "__main__":
    main()
