-- Grant necessary permissions for the trigger function
grant usage on schema public to public;
grant usage on schema auth to public;
grant execute on function public.handle_new_user() to public;
grant all on public.profiles to public; 