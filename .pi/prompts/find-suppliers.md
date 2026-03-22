---
description: Find suppliers for a requirement
---

Find suppliers for: $1

/brave-search "$1 suppliers wholesale manufacturing" -n 10 --content

Return ONLY valid JSON array matching this schema:
[
  {
    "name": "Company Name",
    "website": "https://...",
    "email": "contact@company.com or null",
    "phone": "+1-555-... or null",
    "country": "USA or null",
    "notes": "brief description"
  }
]
