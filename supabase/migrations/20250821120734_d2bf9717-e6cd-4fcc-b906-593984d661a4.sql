
-- Pastikan ekstensi yang dibutuhkan aktif
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Gunakan tanggal WIB (Asia/Jakarta) untuk penentuan expired
create or replace function public.update_expired_users()
returns void
language plpgsql
as $function$
begin
  update public.users
  set user_status = 'Inactive'
  where expired_date < ((now() at time zone 'Asia/Jakarta')::date)
    and user_status = 'Active';
end;
$function$;

-- Hapus jadwal lama (jika ada)
select cron.unschedule('auto-update-user-status-daily');

-- Jadwalkan ulang: 00:00 WIB = 17:00 UTC setiap hari
select cron.schedule(
  'auto-update-user-status-daily',
  '0 17 * * *',
  $$
  select
    net.http_post(
      url:='https://zughojwkppzecdejdwuk.supabase.co/functions/v1/auto-update-user-status',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z2hvandrcHB6ZWNkZWpkd3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDkxNzYsImV4cCI6MjA2NTQ4NTE3Nn0.Jt-GOaNDij9k7vlALfvRrVO6p5C92AF5MuQabt593R0"}'::jsonb,
      body:='{"scheduled": true, "tz": "Asia/Jakarta"}'::jsonb
    ) as request_id;
  $$
);
