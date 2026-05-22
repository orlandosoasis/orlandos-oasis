
REVOKE ALL ON FUNCTION public.cancel_subscription(text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reactivate_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_subscription(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;
