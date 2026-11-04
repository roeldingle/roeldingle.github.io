alter table public.portfolio_notes
  drop column if exists status;

notify pgrst, 'reload schema';
