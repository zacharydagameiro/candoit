# Supplier Finder Workflow Requirements

## Overview
When a user promotes a requirement from the discovery chat, they can click "Find Supplier" to automatically search for and save suppliers to the database.

---

## User Flow

### 1. Discovery Chat
- User chats with AI about their product (e.g., "Prime Drink")
- AI suggests requirements (e.g., "Plastic Water Bottle")
- Requirements appear in "Requirement Candidates" panel with "Promoted" and "Discard" buttons

### 2. Promote to Requirements
- User clicks **"Promoted"** on a candidate
- Creates entry in `requirements` table:
  - `title`: "Plastic Water Bottle"
  - `category`: "Packaging"
  - `status`: "draft"
  - `product_id`: links to Prime Drink

### 3. Requirements Table
- Shows all promoted requirements
- "Draft" status displays **"Find Supplier"** button

### 4. Find Suppliers
- User clicks **"Find Supplier"** button
- API updates status to "researching"
- API spawns pi process:
  ```
  pi -p --mode json --skill brave-search "/find-suppliers \"Plastic Water Bottle\""
  ```

### 5. Pi Execution
- Loads brave-search skill
- Searches web for "Plastic Water Bottle suppliers wholesale"
- Returns JSON array of suppliers

### 6. Save to Database
For each supplier found:
1. Check if `suppliers` table already has this website
2. If not, insert new supplier
3. Insert link into `requirement_suppliers` with status "candidate"
4. Update requirement status to "matched"

### 7. Display Results
- Requirements table shows supplier count
- Click requirement to see supplier list
- Each supplier shows: name, website, contact, match status

---

## Database Tables

### requirements
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| product_id | uuid | → products |
| title | string | "Plastic Water Bottle" |
| description | text | what it is |
| category | string | "Packaging" |
| status | enum | draft → researching → matched → blocked |

### suppliers
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| name | string | company name |
| website | string | unique identifier |
| email | string | contact |
| phone | string | contact |
| country | string | location |
| notes | text | description |

### requirement_suppliers
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| requirement_id | uuid | → requirements |
| supplier_id | uuid | → suppliers |
| match_status | enum | candidate / shortlisted / rejected |
| fit_score | number | optional 0-100 |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| draft | Never searched for suppliers |
| researching | Pi is currently searching |
| matched | Found 1+ suppliers |
| blocked | Search failed or no results |

---

## API Endpoint

**POST /api/requirements/:id/find-suppliers**

Steps:
1. Get requirement by ID
2. Update status to "researching"
3. Spawn pi with brave-search skill
4. Parse pi JSON output
5. Insert new suppliers (deduplicate by website)
6. Create requirement_supplier links
7. Update status to "matched" or "blocked"
8. Return count of suppliers found

---

## Pi Prompt Template

File: `.pi/prompts/find-suppliers.md`

```markdown
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
```

---

## UI Components

### Requirements Table
- Requirement name
- Category
- Status badge
- Action button ("Find Supplier" or supplier count)

### Supplier List (expanded row or modal)
- Company name
- Website link
- Contact info
- Match status dropdown
- Notes field

---

## Indexes

```sql
-- For deduplication lookups
CREATE INDEX idx_suppliers_website ON suppliers(website);

-- For fetching suppliers by requirement
CREATE INDEX idx_reqsupp_requirement_id ON requirement_suppliers(requirement_id);
```
