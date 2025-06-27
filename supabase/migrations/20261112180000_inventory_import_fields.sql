-- Expand inventory for bulk import across retail verticals
-- (hardware, paint, grocery, clothing, etc.)

alter table public.inventory_items
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists unit text default 'pcs',
  add column if not exists brand text,
  add column if not exists supplier text,
  add column if not exists min_quantity numeric default 0,
  add column if not exists description text;

create index if not exists inventory_items_user_sku_idx
  on public.inventory_items (user_id, sku)
  where sku is not null and length(trim(sku)) > 0;

create index if not exists inventory_items_user_barcode_idx
  on public.inventory_items (user_id, barcode)
  where barcode is not null and length(trim(barcode)) > 0;

create index if not exists inventory_items_user_name_idx
  on public.inventory_items (user_id, lower(item_name));
