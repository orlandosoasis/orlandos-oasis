
-- Fix infinite recursion between route_issues and route_issue_services policies
-- by replacing cross-table EXISTS checks with SECURITY DEFINER helper functions.

CREATE OR REPLACE FUNCTION private.is_affected_homeowner_of_route_issue(_issue_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.route_issue_services ris
    WHERE ris.route_issue_id = _issue_id
      AND ris.homeowner_id = _uid
  );
$$;

CREATE OR REPLACE FUNCTION private.is_tech_on_route_issue(_issue_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.route_issues ri
    WHERE ri.id = _issue_id
      AND (ri.technician_id = _uid OR ri.reassigned_to_id = _uid)
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_affected_homeowner_of_route_issue(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_tech_on_route_issue(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Affected homeowner views route issue" ON public.route_issues;
CREATE POLICY "Affected homeowner views route issue"
  ON public.route_issues FOR SELECT
  USING (private.is_affected_homeowner_of_route_issue(id, auth.uid()));

DROP POLICY IF EXISTS "Technician views assigned route_issue_services" ON public.route_issue_services;
CREATE POLICY "Technician views assigned route_issue_services"
  ON public.route_issue_services FOR SELECT
  USING (private.is_tech_on_route_issue(route_issue_id, auth.uid()));
