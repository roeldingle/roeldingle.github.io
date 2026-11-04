alter table public.portfolio_notes
  add column if not exists content_markdown text not null default '';

notify pgrst, 'reload schema';
