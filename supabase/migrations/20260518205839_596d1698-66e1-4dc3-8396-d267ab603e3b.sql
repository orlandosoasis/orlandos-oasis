
CREATE TABLE IF NOT EXISTS public.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('chemical','equipment')),
  per_pool_cost numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expense items"
  ON public.expense_items
  FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER expense_items_set_updated_at
  BEFORE UPDATE ON public.expense_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.expense_items (name, category, per_pool_cost, sort_order) VALUES
  ('Chlorine tablets (3")',       'chemical', 18,  10),
  ('Liquid shock',                'chemical', 6,   20),
  ('Muriatic acid',               'chemical', 4,   30),
  ('Algaecide',                   'chemical', 3,   40),
  ('Cyanuric acid stabilizer',    'chemical', 2,   50),
  ('pH increaser / decreaser',    'chemical', 2.5, 60),
  ('Calcium hardness',            'chemical', 2,   70),
  ('Clarifier & enzyme',          'chemical', 2.5, 80),
  ('Skimmer nets & brushes (amortized)', 'equipment', 3,   10),
  ('Test strips & reagents',      'equipment', 1.5, 20),
  ('Vacuum hose / pole wear',     'equipment', 2,   30),
  ('Filter cleaner & lube',       'equipment', 1.5, 40);
