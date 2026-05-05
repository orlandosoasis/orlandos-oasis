grant execute on function public.has_role(uuid, public.app_role) to authenticated;

alter policy "Admins view all profiles"
on public.profiles
to authenticated;

alter policy "Admins update all profiles"
on public.profiles
to authenticated;

alter policy "Users view own profile"
on public.profiles
to authenticated;

alter policy "Users insert own profile"
on public.profiles
to authenticated;

alter policy "Users update own profile"
on public.profiles
to authenticated;