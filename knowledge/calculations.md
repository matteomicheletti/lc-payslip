# Payslip Calculation Logic

This document describes the calculation pipeline shared by both app variants.
The two versions (`/main.js` and `/studio-paghe/main.js`) execute **identical calculations**.
They only differ in what is displayed (see "Output Differences" at the bottom).

---

## 1. CSV Parsing & Filtering

```
INPUT: CSV file, selected month (MM), selected year (YYYY)

parse CSV with PapaParse (header: true) -> array of row objects

checkDate = MM + "-" + YYYY          // e.g. "03-2024"

filteredRows = []
FOR each row IN parsed CSV:
    IF row["GIORNO INIZIO"] contains checkDate:
        keep row
```

### Sorting

```
sort filteredRows by:
    primary:  NOME DIPENDENTE  (ascending, alphabetical)
    secondary: GIORNO INIZIO   (descending, most recent day first)
               (dd-mm-yyyy string reversed to yyyy-mm-dd for comparison)
```

---

## 2. Row Mapping

Each CSV row is mapped to an internal object. Numeric fields default to 0 when empty.

```
row -> {
    giorno_inizio       : string   (dd-mm-yyyy)
    nome_dipendente     : string
    tempo_tot_ord       : string   ("N ore e M minuti")
    tempo_tot_straord   : string
    nome_cantiere       : string
    note                : string
    min_ord_val         : float    (ordinary minutes)
    min_straord_val     : float    (overtime minutes)
    km_auto_personale   : int      (personal car km)
    km_auto_aziendale   : int      (company car km)
    durc                : string
    luogo_destinazione  : string
    poo                 : string   (hourly rate ordinary — from CSV)
    pos                 : string   (hourly rate overtime — from CSV)
    pbp                 : string   (meal voucher value — from CSV)
    extra               : float    (extra pay amount)
}
```

---

## 3. Grouping: Employee -> Day

Data is grouped into a nested structure: `groupedData[employee][day]`.

When multiple CSV rows share the same employee + day, their values are **accumulated**:
- String fields (tempo, cantiere, note, durc, luogo): concatenated with `<br/>`
- Numeric fields (min_ord_val, min_straord_val, km): summed
- Array fields (poo, pos, pbp): pushed (only first element `[0]` is used later)
- extra: summed

### Daily Overtime Spillover (per day, per employee)

```
IF day.min_ord_val > 480:                    // 480 min = 8 hours
    delta = day.min_ord_val - 480
    day.min_straord_val += delta             // excess goes to overtime
    day.min_ord_val = 480                    // cap ordinary at 8h
    day.tempo_tot_ord = "8 ore e 0 minuti"
    day.tempo_tot_straord = format(delta)    // convert delta minutes to "H ore e M minuti"
```

---

## 4. Per-Employee Monthly Totals

For each employee, iterate over all their days and accumulate:

```
min_ord_val         = SUM of all days' min_ord_val           // total ordinary minutes
min_straord_val     = SUM of all days' min_straord_val       // total overtime minutes
km_auto_personale   = SUM of all days' km_auto_personale
km_auto_aziendale   = SUM of all days' km_auto_aziendale
extra               = SUM of all days' extra
poo                 = first day's poo[0]    // NOTE: overwritten each day, last day's value wins
pos                 = first day's pos[0]    //        (rates assumed constant per employee/month)
pbp                 = first day's pbp[0]
```

### Meal Voucher (Buono Pasto)

```
total_buono_past = 0
FOR each day:
    day_hours = (day.min_ord_val + day.min_straord_val) / 60
    IF day_hours >= 6:
        total_buono_past += pbp              // add one meal voucher value
```

---

## 5. Final Calculations

### Hours -> Amounts

```
total_ord_hours     = min_ord_val / 60
total_straord_hours = min_straord_val / 60

importo_ord     = total_ord_hours     * poo     // ordinary pay
importo_straord = total_straord_hours * pos     // overtime pay
```

### 80/20 Overtime Split (added March 2024)

```
IF total_straord_hours > 5:
    ore_straord     = ROUND(total_straord_hours * 0.80)
    ore_IB          = ROUND(total_straord_hours * 0.20)
    importo_IB      = ROUND(importo_straord * 0.20)
    importo_straord = ROUND(importo_straord * 0.80)    // overwrites full value
ELSE:
    ore_IB = 0
    importo_IB = 0
```

**NOTE:** `ore_staord` (typo in code, missing 'r') is computed but never used in output.
`importo_IB` is computed but never added to `totale_da_pagare` nor displayed.

### KM Reimbursement

```
total_km = km_auto_personale + km_auto_aziendale
costo_km = (km_auto_personale * 0.37) - (km_auto_aziendale * 0.37)
```

This means company car km are **subtracted** at the same rate. If an employee only used a
company car, `costo_km` would be negative (reducing the total).

### Grand Total

```
totale_da_pagare = importo_ord
                 + importo_straord      // (80% if split applied)
                 + total_buono_past
                 + extra
                 + costo_km
```

**NOTE:** `importo_IB` (the 20% overtime portion) is NOT included in `totale_da_pagare`.

---

## 6. Output Differences Between Variants

### Root version (`/index.html` + `/main.js`) — Full Employee Payslip

**Daily table columns shown:**
| Giorno | Tempo Ordinario | Tempo Straordinario | Nome Cantiere | Km Auto Pers. | Km Auto Az. | Luogo di Destinazione | Note |

**Summary table 1 — "TOTALE ORE e KM":**
- Totale Ore Ordinarie Lavorate (only shown when 80/20 split applies)
- Totale Ore Straordinarie Lavorate = ore_IB
- TOS = total_straord_hours
- Totale KM Percorsi

**Summary table 2 — "RIEPILOGO IMPORTO":**
- Totale da Pagare (red)
- PLUS Straordinario = importo_straord
- RIMBORSO KM = costo_km
- EXTRA = extra
- PLUS Ordinario = importo_ord
- Buono Pasto Totale = total_buono_past

---

### Studio Paghe version (`/studio-paghe/`) — Reduced Pay Office Payslip

**Daily table columns shown:**
| Giorno | Tempo Ordinario | Tempo Straordinario | Nome Cantiere | Luogo di Destinazione |

(No km columns, no notes column)

**Summary table — "TOTALE ORE":**
- Totale Ore Ordinarie Lavorate (only shown when 80/20 split applies)
- Totale Ore Straordinarie Lavorate = ore_IB
- Trasferta ITALIA = totale_da_pagare (red)

(No detailed cost breakdown — just the final amount labeled "Trasferta ITALIA")

---

## 7. Known Quirks / Potential Issues

1. **`ore_staord` typo**: Variable name missing 'r' (`ore_staord` instead of `ore_straord`).
   Becomes an implicit global. Computed but never displayed.

2. **`importo_IB` not in total**: The 20% overtime amount is calculated but excluded from
   `totale_da_pagare`. This may be intentional (paid separately?) or a bug.

3. **`ore_IB` row in non-split case**: When overtime <= 5h, the code tries to remove the
   "Totale Ore Ordinarie Lavorate" row via regex but assigns the result to a local `result`
   variable that is never used — so the `{ore_IB}` placeholder remains unreplaced in the HTML
   (displays literally as `{ore_IB}`), and the "Totale Ore Ordinarie Lavorate" row is NOT
   actually removed.

4. **`poo`/`pos`/`pbp` overwritten per day**: These rate values are reassigned (not accumulated)
   on each day iteration, so only the last day's values are used. Works correctly only if
   rates are constant across the month for a given employee.

5. **PapaParse loaded twice** in both HTML files (cdnjs + jsdelivr CDN).
