# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Italian payslip ("busta paga") generator. A static client-side web app that reads employee work data from a CSV file, filters by month/year, computes hours (ordinary/overtime), km reimbursement, meal vouchers, and generates downloadable HTML payslips (individual or zipped).

## Architecture

Two variants of the same app live side-by-side:

- **Root (`/`)** — Full payslip for employees, showing all columns (km, notes, extras, detailed cost breakdown).
- **`/studio-paghe/`** — Reduced version for the pay office ("studio paghe"), with fewer columns and a simplified summary (just hours and "Trasferta ITALIA").

Each variant is a single `index.html` + `main.js` pair with no build step. Both share the same logic structure but diverge in the HTML template and which table columns are rendered.

## Running

Open `index.html` (or `studio-paghe/index.html`) directly in a browser. No server or build tool required.

## Dependencies (all loaded via CDN)

- **Tailwind CSS 2.2.19** — UI styling
- **PapaParse 5.3.0** — CSV parsing
- **JSZip 3.7.0** — ZIP generation for bulk download
- **html2pdf.js 0.9.2** — included but not actively used in current code

## Key Business Logic

- CSV rows are filtered by `GIORNO INIZIO` matching `MM-YYYY` (date format: `dd-mm-yyyy`).
- Data is grouped by employee (`NOME DIPENDENTE`), then by day.
- If ordinary minutes exceed 480 (8 hours) in a day, the excess spills into overtime.
- If total overtime hours > 5, an 80/20 split is applied (80% overtime, 20% "IB" hours) — added March 2024.
- Meal voucher (`PBP`) is granted when an employee works >= 6 hours in a day.
- KM reimbursement rate: 0.37 EUR/km for personal car; company car km are subtracted.

## CSV Expected Columns

`GIORNO INIZIO`, `NOME DIPENDENTE`, `TEMPO TOT. ORD`, `TEMPO TOT. STRAORD.`, `NOME CANTIERE`, `NOTE`, `MIN. ORD. VAL`, `MIN. STRAORD. VAL`, `KM Auto Personale`, `KM Auto Aziendale`, `DURC`, `LUOGO DI DESTINAZIONE`, `POO`, `POS`, `PBP`, `EXTRA`

## Language

The UI and all labels are in Italian. Variable names and comments mix Italian and English.
