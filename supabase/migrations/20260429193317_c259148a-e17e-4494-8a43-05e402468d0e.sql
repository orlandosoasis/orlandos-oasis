
-- Enums
CREATE TYPE public.app_role AS ENUM ('homeowner', 'technician', 'admin');
CREATE TYPE public.service_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.time_window AS ENUM ('morning', 'afternoon', 'evening');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.issue_status AS ENUM ('open', 'resolved');

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========== profiles ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  role public.app_role NOT NULL DEFAULT 'homeowner',
  avatar_url TEXT,
  phone TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'homeowner')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== pools ===========
CREATE TABLE public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  pool_type TEXT,
  pool_size TEXT,
  water_type TEXT,
  equipment TEXT,
  access_method TEXT,
  access_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== services ===========
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 1,
  service_date DATE NOT NULL,
  time_window public.time_window NOT NULL,
  status public.service_status NOT NULL DEFAULT 'scheduled',
  completed_tasks TEXT[],
  tech_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners view own services" ON public.services FOR SELECT USING (auth.uid() = homeowner_id);
CREATE POLICY "Technicians view assigned services" ON public.services FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Technicians update assigned services" ON public.services FOR UPDATE USING (auth.uid() = technician_id);
CREATE POLICY "Admins manage all services" ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Homeowners create own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pools policies (reference services)
CREATE POLICY "Homeowners manage own pools" ON public.pools FOR ALL
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);
CREATE POLICY "Technicians view assigned pools" ON public.pools FOR SELECT
  USING (public.has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.services s WHERE s.pool_id = pools.id AND s.technician_id = auth.uid()
  ));
CREATE POLICY "Admins manage all pools" ON public.pools FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== technician_applications ===========
CREATE TABLE public.technician_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  experience TEXT,
  resume_url TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.technician_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.technician_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view applications" ON public.technician_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update applications" ON public.technician_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete applications" ON public.technician_applications FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_technician_applications_updated_at BEFORE UPDATE ON public.technician_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== applicant_certifications ===========
CREATE TABLE public.applicant_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.technician_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applicant_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add certifications" ON public.applicant_certifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view certifications" ON public.applicant_certifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage certifications" ON public.applicant_certifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_applicant_certifications_updated_at BEFORE UPDATE ON public.applicant_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== issues ===========
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  service_date DATE,
  related_service TEXT,
  status public.issue_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners manage own issues" ON public.issues FOR ALL
  USING (auth.uid() = homeowner_id) WITH CHECK (auth.uid() = homeowner_id);
CREATE POLICY "Admins manage all issues" ON public.issues FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== messages ===========
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients update read state" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Admins view all messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== reviews ===========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  status public.review_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Reviewers view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Technicians view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Reviewers create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Admins manage all reviews" ON public.reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
