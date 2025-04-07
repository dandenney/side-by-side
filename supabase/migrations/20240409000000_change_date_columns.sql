-- Change date_range_start and date_range_end columns from timestampz to date type
alter table public.url_items 
  alter column date_range_start type date using date_range_start::date,
  alter column date_range_end type date using date_range_end::date; 