#!/usr/bin/env python3
"""
Find employee+month combinations where the overtime 80/20 split bug
produces a discrepancy between old and new calculation methods.
"""

import csv
import math
from collections import defaultdict

CSV_PATH = "/home/matteo/Documents/dev/lc-payslip/data.csv"

# Read CSV
with open(CSV_PATH, encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Group by (employee, month, day)
# Key: (employee, mm-yyyy) -> { day -> [rows] }
emp_month_day = defaultdict(lambda: defaultdict(list))

for row in rows:
    giorno_inizio = (row.get("GIORNO INIZIO") or "").strip()
    nome = (row.get("NOME DIPENDENTE") or "").strip()
    if not giorno_inizio or not nome:
        continue
    # date format: dd-mm-yyyy
    parts = giorno_inizio.split("-")
    if len(parts) != 3:
        continue
    dd, mm, yyyy = parts
    month_key = f"{mm}-{yyyy}"
    emp_month_day[(nome, month_key)][giorno_inizio].append(row)


def parse_float(val):
    """Parse a numeric value, returning 0.0 on failure."""
    if not val:
        return 0.0
    val = val.strip().replace(",", ".")
    try:
        return float(val)
    except ValueError:
        return 0.0


# For each employee+month, compute totals with spillover, then check for discrepancy
results = []

for (employee, month), days_dict in sorted(emp_month_day.items()):
    total_ord_min = 0.0
    total_straord_min = 0.0
    pos = None

    for day, day_rows in days_dict.items():
        day_ord = 0.0
        day_straord = 0.0
        for r in day_rows:
            day_ord += parse_float(r.get("MIN. ORD. VAL"))
            day_straord += parse_float(r.get("MIN. STRAORD. VAL"))
            if pos is None:
                p = parse_float(r.get("POS"))
                if p > 0:
                    pos = p

        # Spillover: if ordinary > 480 min (8h), excess goes to overtime
        if day_ord > 480:
            excess = day_ord - 480
            day_ord = 480
            day_straord += excess

        total_ord_min += day_ord
        total_straord_min += day_straord

    if pos is None:
        pos = 0.0

    total_straord_hours = total_straord_min / 60.0

    # Only applies when total overtime > 5 hours
    if total_straord_hours <= 5:
        continue

    # Full overtime amount (before split)
    full_importo_straord = total_straord_hours * pos

    # OLD (buggy) method: independent rounding
    ore_straord_old = round(total_straord_hours * 0.8)
    ore_IB_old = round(total_straord_hours * 0.2)
    importo_straord_old = round(full_importo_straord * 0.8)
    importo_IB_old = round(full_importo_straord * 0.2)

    # NEW (fixed) method: complementary hours, recalculated amounts
    ore_straord_new = round(total_straord_hours * 0.8)
    ore_IB_new = round(total_straord_hours) - ore_straord_new
    importo_straord_new = ore_straord_new * pos
    importo_IB_new = ore_IB_new * pos

    # Check for any difference
    has_diff = (
        ore_straord_old != ore_straord_new
        or ore_IB_old != ore_IB_new
        or importo_straord_old != importo_straord_new
        or importo_IB_old != importo_IB_new
    )

    if has_diff:
        results.append({
            "employee": employee,
            "month": month,
            "total_straord_hours": total_straord_hours,
            "pos": pos,
            "full_importo": full_importo_straord,
            "ore_straord_old": ore_straord_old,
            "ore_IB_old": ore_IB_old,
            "importo_straord_old": importo_straord_old,
            "importo_IB_old": importo_IB_old,
            "ore_straord_new": ore_straord_new,
            "ore_IB_new": ore_IB_new,
            "importo_straord_new": importo_straord_new,
            "importo_IB_new": importo_IB_new,
        })

# Output report
print("=" * 120)
print("OVERTIME 80/20 SPLIT BUG — DISCREPANCY REPORT")
print("=" * 120)
print()

if not results:
    print("No discrepancies found.")
else:
    print(f"Found {len(results)} employee+month combination(s) with discrepancies:\n")
    for i, r in enumerate(results, 1):
        print(f"--- Case {i} ---")
        print(f"  Employee:            {r['employee']}")
        print(f"  Month:               {r['month']}")
        print(f"  Total OT hours:      {r['total_straord_hours']:.4f}")
        print(f"  POS (OT rate):       {r['pos']:.2f}")
        print(f"  Full OT amount:      {r['full_importo']:.2f}")
        print()
        print(f"  OLD (buggy):   ore_straord={r['ore_straord_old']}  ore_IB={r['ore_IB_old']}  "
              f"importo_straord={r['importo_straord_old']}  importo_IB={r['importo_IB_old']}  "
              f"total_importo={r['importo_straord_old'] + r['importo_IB_old']}")
        print(f"  NEW (fixed):   ore_straord={r['ore_straord_new']}  ore_IB={r['ore_IB_new']}  "
              f"importo_straord={r['importo_straord_new']:.2f}  importo_IB={r['importo_IB_new']:.2f}  "
              f"total_importo={r['importo_straord_new'] + r['importo_IB_new']:.2f}")
        print()
        # Show differences
        diffs = []
        if r['ore_straord_old'] != r['ore_straord_new']:
            diffs.append(f"ore_straord: {r['ore_straord_old']} -> {r['ore_straord_new']}")
        if r['ore_IB_old'] != r['ore_IB_new']:
            diffs.append(f"ore_IB: {r['ore_IB_old']} -> {r['ore_IB_new']}")
        if r['importo_straord_old'] != r['importo_straord_new']:
            diffs.append(f"importo_straord: {r['importo_straord_old']} -> {r['importo_straord_new']:.2f}")
        if r['importo_IB_old'] != r['importo_IB_new']:
            diffs.append(f"importo_IB: {r['importo_IB_old']} -> {r['importo_IB_new']:.2f}")
        old_total = r['importo_straord_old'] + r['importo_IB_old']
        new_total = r['importo_straord_new'] + r['importo_IB_new']
        if old_total != new_total:
            diffs.append(f"total_importo: {old_total} -> {new_total:.2f} (delta={new_total - old_total:.2f})")
        print(f"  DIFFERENCES:   {' | '.join(diffs)}")
        print()

print("=" * 120)
