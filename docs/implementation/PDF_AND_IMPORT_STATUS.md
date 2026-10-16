# PDF + Inventory Import Status

**Date:** 2026-11-12

## PDF design reference

- No separate invoice/PDF mockup file exists in the repository.
- The glass invoice mockup previously supplied in chat (Sella branding, frosted card, blue mesh background) remains the design system implemented in `src/lib/invoicePdf.ts`.
- All-debtors PDF was rebuilt from a flat summary table into a multi-page debtors statement with shop identity, distinct shop payment number, per-debtor line items, paid/remaining, status, page numbers, and financial summary.

## Chatbot inventory import

- ChatSella explains CSV/Excel import (`help_import` intent) and never writes inventory silently.
- Full spreadsheet upload inside chat is deferred: deterministic import wizard at `/import-inventory` is the supported path.
