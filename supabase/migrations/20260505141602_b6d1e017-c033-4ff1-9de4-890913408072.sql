create schema if not exists private;
revoke all on schema private from public;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = _user_id
      and role = _role
  );
$$;

grant execute on function private.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.has_role(uuid, public.app_role) from public;

alter policy "Admins manage certifications"
on public.applicant_certifications
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view certifications"
on public.applicant_certifications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Applicants add own certifications"
on public.applicant_certifications
with check (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  or exists (
    select 1
    from public.technician_applications ta
    where ta.id = applicant_certifications.application_id
      and ta.email = (
        select profiles.email
        from public.profiles
        where profiles.id = auth.uid()
      )
  )
);

alter policy "Admins manage all issues"
on public.issues
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view all messages"
on public.messages
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all pools"
on public.pools
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Technicians view assigned pools"
on public.pools
using (
  private.has_role(auth.uid(), 'technician'::public.app_role)
  and exists (
    select 1
    from public.services s
    where s.pool_id = pools.id
      and s.technician_id = auth.uid()
  )
);

alter policy "Admins update all profiles"
on public.profiles
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view all profiles"
on public.profiles
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all reviews"
on public.reviews
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins manage all services"
on public.services
using (private.has_role(auth.uid(), 'admin'::public.app_role))
with check (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins delete applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins update applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));

alter policy "Admins view applications"
on public.technician_applications
using (private.has_role(auth.uid(), 'admin'::public.app_role));