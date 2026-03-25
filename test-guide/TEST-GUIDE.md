# Guida al Test — Bug Calcolo Straordinario 80/20

## Cosa testare

Il bug riguarda il calcolo dello split 80/20 sulle ore straordinarie.
Quando le ore straordinarie mensili superano 5, il vecchio codice calcolava
gli importi come `Math.round(importo_totale * 0.8)` invece di `ore_arrotondate * tariffa_oraria`.

## Setup

Hai a disposizione 4 pagine HTML:

| File | Versione | Tipo |
|------|----------|------|
| `index.html` | CORRETTA (fix applicato) | Busta paga completa |
| `original-index.html` | ORIGINALE (con bug) — sfondo rosso | Busta paga completa |
| `studio-paghe/index.html` | CORRETTA (fix applicato) | Studio paghe |
| `studio-paghe/original-index.html` | ORIGINALE (con bug) — sfondo rosso | Studio paghe |

Le versioni originali hanno sfondo rosso e titolo "CON BUG" per evitare confusione.

## Come testare

1. Apri **due schede del browser** affiancate
2. In una scheda apri `original-index.html` (versione con bug, rossa)
3. Nell'altra apri `index.html` (versione corretta, blu)
4. In entrambe: carica `data.csv`, seleziona lo stesso mese/anno
5. Clicca "Genera Buste Paga"
6. Scarica la busta paga dello stesso dipendente da entrambe
7. Confronta i valori nella sezione "RIEPILOGO IMPORTO"

## Casi di test consigliati

I 3 casi seguenti coprono scenari diversi di discrepanza. Usa `data.csv` come input.

---

### TEST 1 — Piccola discrepanza (centesimi)

- **Dipendente:** Abdellah Dakir
- **Mese:** Giugno (06) — **Anno:** 2024
- **Ore straordinarie totali:** 36.00
- **POS (tariffa oraria straord.):** 12.89

| Valore | Originale (bug) | Corretto |
|--------|-----------------|----------|
| ore_straord (80%) | 29 | 29 |
| ore_IB (20%) | 7 | 7 |
| PLUS Straordinario | 371.00 | 373.81 |
| importo_IB | 93.00 | 90.23 |
| **Differenza totale** | | **+0.04 EUR** |

**Cosa verificare:** Le ore sono uguali, ma gli importi cambiano leggermente.
Nel vecchio: `round(464.04 * 0.8) = 371` | Nel nuovo: `29 * 12.89 = 373.81`

---

### TEST 2 — Discrepanza significativa (euro)

- **Dipendente:** Abdellah Dakir
- **Mese:** Agosto (08) — **Anno:** 2024
- **Ore straordinarie totali:** 49.50
- **POS (tariffa oraria straord.):** 12.89

| Valore | Originale (bug) | Corretto |
|--------|-----------------|----------|
| ore_straord (80%) | 40 | 40 |
| ore_IB (20%) | 10 | 10 |
| PLUS Straordinario | 510.00 | 515.60 |
| importo_IB | 128.00 | 128.90 |
| **Differenza totale** | | **+6.50 EUR** |

**Cosa verificare:** Stesse ore, ma importo straordinario differisce di oltre 5 EUR.
Nel vecchio: `round(638.06 * 0.8) = 510` | Nel nuovo: `40 * 12.89 = 515.60`

---

### TEST 3 — Cambiano anche le ore (+ discrepanza in euro)

- **Dipendente:** Alexander Storari
- **Mese:** Gennaio (01) — **Anno:** 2025
- **Ore straordinarie totali:** 34.50
- **POS (tariffa oraria straord.):** 16.18

| Valore | Originale (bug) | Corretto |
|--------|-----------------|----------|
| ore_straord (80%) | 28 | 28 |
| ore_IB (20%) | **7** | **6** |
| PLUS Straordinario | 447.00 | 453.04 |
| importo_IB | 112.00 | 97.08 |
| **Differenza totale** | | **-8.88 EUR** |

**Cosa verificare:** Qui anche `ore_IB` cambia (da 7 a 6) perche il vecchio codice
arrotondava `round(34.5 * 0.2) = round(6.9) = 7`, mentre il nuovo fa
`round(34.5) - round(34.5 * 0.8) = 35 - 28 = 6` (garantendo che la somma sia coerente).

---

## Report completo

Il file `knowledge/discrepancy_report.txt` contiene tutte le 413 combinazioni
dipendente+mese con discrepanze trovate nei dati di `data.csv`.

## Dopo il test

Una volta verificato che i valori corretti corrispondono alla tabella sopra,
i file `original-*` possono essere eliminati.
