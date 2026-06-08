

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;



































SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;








SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Name: asset_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    description text,
    default_depreciation_method text,
    default_useful_life integer
);


ALTER TABLE public.asset_categories OWNER TO postgres;

--
-- Name: asset_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.asset_locations OWNER TO postgres;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    description text,
    category_id uuid,
    location_id uuid,
    purchase_date date,
    purchase_price numeric,
    current_value numeric,
    status text DEFAULT 'active'::text,
    assigned_to uuid,
    serial_number text,
    notes text,
    is_locked boolean DEFAULT false,
    depreciation_override numeric,
    approved_by uuid,
    approved_at timestamp with time zone,
    useful_life integer DEFAULT 5,
    depreciation_method text,
    residual_value numeric
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: COLUMN assets.useful_life; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assets.useful_life IS 'Useful life in years for depreciation calculation. 0 means infinite (no depreciation).';


--
-- Name: assets_with_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.assets_with_details AS
 SELECT a.id,
    a.company_id,
    a.created_at,
    a.updated_at,
    a.name,
    a.description,
    a.category_id,
    a.location_id,
    a.purchase_date,
    a.purchase_price,
    a.current_value,
    a.status,
    a.assigned_to,
    a.serial_number,
    a.notes,
    a.is_locked,
    a.depreciation_override,
    a.approved_by,
    a.approved_at,
    a.useful_life,
    a.depreciation_method,
    a.residual_value,
    ac.name AS category_name,
    al.name AS location_name
   FROM ((public.assets a
     LEFT JOIN public.asset_categories ac ON ((a.category_id = ac.id)))
     LEFT JOIN public.asset_locations al ON ((a.location_id = al.id)));


ALTER VIEW public.assets_with_details OWNER TO postgres;

--
-- Name: get_my_company_assets(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_my_company_assets() RETURNS SETOF public.assets_with_details
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT awd.*
  FROM assets_with_details awd
  WHERE awd.company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
  )
$$;


ALTER FUNCTION public.get_my_company_assets() OWNER TO postgres;

--
-- Name: get_user_company_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_company_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return (
    select company_id 
    from user_companies 
    where user_id = auth.uid() and is_active = true 
    limit 1
  );
end;
$$;


ALTER FUNCTION public.get_user_company_id() OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  company_id_var UUID;
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), '');
  
  -- Assign user to default company with staff role
  -- First check if default company exists
  SELECT id INTO company_id_var FROM companies WHERE name = 'Default Company' LIMIT 1;
  
  -- If default company doesn't exist, create it
  IF company_id_var IS NULL THEN
    INSERT INTO companies (name) VALUES ('Default Company') RETURNING id INTO company_id_var;
  END IF;
  
  -- Link user to company with staff role
  INSERT INTO company_users (user_id, company_id, role) 
  VALUES (NEW.id, company_id_var, 'staff');
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: is_company_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_company_admin(company_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
  return exists (
    select 1 
    from user_companies 
    where user_id = auth.uid() and company_id = $1 and role = 'admin' and is_active = true
  );
end;
$_$;


ALTER FUNCTION public.is_company_admin(company_id uuid) OWNER TO postgres;

--
-- Name: asset_disposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_disposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    disposal_date date NOT NULL,
    disposal_reason text,
    sale_price numeric,
    disposal_method text,
    approved_by uuid,
    approved_at timestamp with time zone,
    is_approved boolean DEFAULT false
);


ALTER TABLE public.asset_disposals OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    logo_url text,
    address text,
    default_currency text DEFAULT 'USD'::text,
    default_depreciation_method text DEFAULT 'straight_line'::text,
    default_useful_life integer DEFAULT 5,
    default_salvage_value numeric DEFAULT 0
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: company_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    CONSTRAINT company_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])))
);


ALTER TABLE public.company_users OWNER TO postgres;

--
-- Name: depreciation_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.depreciation_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    depreciation_date date NOT NULL,
    depreciation_amount numeric NOT NULL,
    accumulated_depreciation numeric NOT NULL,
    book_value numeric NOT NULL,
    method text NOT NULL
);


ALTER TABLE public.depreciation_records OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    file_url text NOT NULL,
    document_type text NOT NULL,
    is_required boolean DEFAULT false,
    expiry_date date,
    reminder_days integer DEFAULT 30
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    quantity integer DEFAULT 0,
    unit_price numeric,
    supplier text,
    location text,
    notes text
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: maintenance_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    description text,
    frequency text NOT NULL,
    frequency_interval integer DEFAULT 1,
    start_date date NOT NULL,
    next_due_date date NOT NULL,
    last_completed_date date,
    is_active boolean DEFAULT true,
    cost_estimate numeric,
    assigned_to uuid,
    priority text DEFAULT 'medium'::text,
    notes text
);


ALTER TABLE public.maintenance_schedules OWNER TO postgres;

--
-- Name: user_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.user_companies OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    first_name text,
    last_name text,
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_company_info; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_company_info AS
 SELECT cu.user_id,
    cu.company_id,
    cu.role,
    c.name AS company_name,
    up.first_name,
    up.last_name
   FROM ((public.company_users cu
     JOIN public.companies c ON ((cu.company_id = c.id)))
     JOIN public.user_profiles up ON ((cu.user_id = up.id)))
  WHERE (cu.is_active = true);


ALTER VIEW public.user_company_info OWNER TO postgres;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    language text DEFAULT 'en'::text,
    theme text DEFAULT 'light'::text,
    currency text DEFAULT 'USD'::text
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Data for Name: asset_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_categories (id, company_id, created_at, updated_at, name, description, default_depreciation_method, default_useful_life) FROM stdin;
2a2ca2d5-2312-44cb-acd3-62fb933c0ebd	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Electronics	Electronic devices and equipment	straight_line	3
6aac54b2-4025-413d-99ab-0149479aef78	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Furniture	Office furniture and fixtures	straight_line	7
c30ec008-1daa-4f6e-a480-c4ea20f57f39	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Vehicles	Company vehicles and transportation	declining_balance	5
\.


--
-- Data for Name: asset_disposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_disposals (id, company_id, asset_id, created_at, disposal_date, disposal_reason, sale_price, disposal_method, approved_by, approved_at, is_approved) FROM stdin;
\.


--
-- Data for Name: asset_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_locations (id, company_id, created_at, updated_at, name, description) FROM stdin;
15060d3c-4973-4dc2-8f88-f37b2da0c6b0	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Head Office	Main headquarters
c8d0a524-1299-4672-aa3f-822337aa65b1	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Warehouse A	Primary storage facility
48233b8a-0b46-428f-a83a-f0e6a32577ba	11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Branch Office	Regional office location
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, company_id, created_at, updated_at, name, description, category_id, location_id, purchase_date, purchase_price, current_value, status, assigned_to, serial_number, notes, is_locked, depreciation_override, approved_by, approved_at, useful_life, depreciation_method, residual_value) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, created_at, updated_at, name, logo_url, address, default_currency, default_depreciation_method, default_useful_life, default_salvage_value) FROM stdin;
11111111-1111-1111-1111-111111111111	2025-12-16 18:20:05.390886+00	2025-12-16 18:20:05.390886+00	Test Company Inc.	\N	123 Test Street, Test City	USD	straight_line	5	0
\.


--
-- Data for Name: company_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_users (id, user_id, company_id, role, created_at, updated_at, is_active) FROM stdin;
\.


--
-- Data for Name: depreciation_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.depreciation_records (id, company_id, asset_id, created_at, depreciation_date, depreciation_amount, accumulated_depreciation, book_value, method) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, company_id, asset_id, created_at, updated_at, name, file_url, document_type, is_required, expiry_date, reminder_days) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, created_at, name, description, category, quantity, unit_price, supplier, location, notes) FROM stdin;
\.


--
-- Data for Name: maintenance_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_schedules (id, company_id, asset_id, created_at, updated_at, title, description, frequency, frequency_interval, start_date, next_due_date, last_completed_date, is_active, cost_estimate, assigned_to, priority, notes) FROM stdin;
\.


--
-- Data for Name: user_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_companies (id, user_id, company_id, role, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (user_id, created_at, updated_at, language, theme, currency) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, created_at, updated_at, first_name, last_name, phone, avatar_url, is_active) FROM stdin;
\.


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: asset_disposals asset_disposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_disposals
    ADD CONSTRAINT asset_disposals_pkey PRIMARY KEY (id);


--
-- Name: asset_locations asset_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_locations
    ADD CONSTRAINT asset_locations_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_users company_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_pkey PRIMARY KEY (id);


--
-- Name: company_users company_users_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: depreciation_records depreciation_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depreciation_records
    ADD CONSTRAINT depreciation_records_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: maintenance_schedules maintenance_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_pkey PRIMARY KEY (id);


--
-- Name: user_companies user_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_pkey PRIMARY KEY (id);


--
-- Name: user_companies user_companies_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: asset_categories_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX asset_categories_company_id_idx ON public.asset_categories USING btree (company_id);


--
-- Name: asset_disposals_asset_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX asset_disposals_asset_id_idx ON public.asset_disposals USING btree (asset_id);


--
-- Name: asset_disposals_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX asset_disposals_company_id_idx ON public.asset_disposals USING btree (company_id);


--
-- Name: asset_disposals_is_approved_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX asset_disposals_is_approved_idx ON public.asset_disposals USING btree (is_approved);


--
-- Name: asset_locations_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX asset_locations_company_id_idx ON public.asset_locations USING btree (company_id);


--
-- Name: assets_assigned_to_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_assigned_to_idx ON public.assets USING btree (assigned_to);


--
-- Name: assets_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_category_id_idx ON public.assets USING btree (category_id);


--
-- Name: assets_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_company_id_idx ON public.assets USING btree (company_id);


--
-- Name: assets_location_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_location_id_idx ON public.assets USING btree (location_id);


--
-- Name: assets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_status_idx ON public.assets USING btree (status);


--
-- Name: assets_useful_life_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assets_useful_life_idx ON public.assets USING btree (useful_life);


--
-- Name: companies_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX companies_name_idx ON public.companies USING btree (name);


--
-- Name: company_users_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX company_users_company_id_idx ON public.company_users USING btree (company_id);


--
-- Name: company_users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX company_users_role_idx ON public.company_users USING btree (role);


--
-- Name: company_users_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX company_users_user_id_idx ON public.company_users USING btree (user_id);


--
-- Name: depreciation_records_asset_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX depreciation_records_asset_id_idx ON public.depreciation_records USING btree (asset_id);


--
-- Name: depreciation_records_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX depreciation_records_company_id_idx ON public.depreciation_records USING btree (company_id);


--
-- Name: depreciation_records_depreciation_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX depreciation_records_depreciation_date_idx ON public.depreciation_records USING btree (depreciation_date);


--
-- Name: documents_asset_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_asset_id_idx ON public.documents USING btree (asset_id);


--
-- Name: documents_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_company_id_idx ON public.documents USING btree (company_id);


--
-- Name: documents_document_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_document_type_idx ON public.documents USING btree (document_type);


--
-- Name: documents_expiry_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_expiry_date_idx ON public.documents USING btree (expiry_date);


--
-- Name: inventory_items_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inventory_items_category_idx ON public.inventory_items USING btree (category);


--
-- Name: inventory_items_location_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inventory_items_location_idx ON public.inventory_items USING btree (location);


--
-- Name: maintenance_schedules_asset_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenance_schedules_asset_id_idx ON public.maintenance_schedules USING btree (asset_id);


--
-- Name: maintenance_schedules_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenance_schedules_company_id_idx ON public.maintenance_schedules USING btree (company_id);


--
-- Name: maintenance_schedules_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenance_schedules_is_active_idx ON public.maintenance_schedules USING btree (is_active);


--
-- Name: maintenance_schedules_next_due_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenance_schedules_next_due_date_idx ON public.maintenance_schedules USING btree (next_due_date);


--
-- Name: maintenance_schedules_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenance_schedules_priority_idx ON public.maintenance_schedules USING btree (priority);


--
-- Name: user_companies_company_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_companies_company_id_idx ON public.user_companies USING btree (company_id);


--
-- Name: user_companies_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_companies_role_idx ON public.user_companies USING btree (role);


--
-- Name: user_companies_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_companies_user_id_idx ON public.user_companies USING btree (user_id);


--
-- Name: user_profiles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_profiles_user_id_idx ON public.user_profiles USING btree (id);


--
-- Name: asset_categories asset_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_disposals asset_disposals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_disposals
    ADD CONSTRAINT asset_disposals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: asset_disposals asset_disposals_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_disposals
    ADD CONSTRAINT asset_disposals_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_disposals asset_disposals_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_disposals
    ADD CONSTRAINT asset_disposals_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_locations asset_locations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_locations
    ADD CONSTRAINT asset_locations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: assets assets_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assets assets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assets assets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.asset_categories(id) ON DELETE SET NULL;


--
-- Name: assets assets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: assets assets_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.asset_locations(id) ON DELETE SET NULL;


--
-- Name: company_users company_users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_users company_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_users
    ADD CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: depreciation_records depreciation_records_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depreciation_records
    ADD CONSTRAINT depreciation_records_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: depreciation_records depreciation_records_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depreciation_records
    ADD CONSTRAINT depreciation_records_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: documents documents_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: documents documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: maintenance_schedules maintenance_schedules_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: maintenance_schedules maintenance_schedules_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: maintenance_schedules maintenance_schedules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_schedules
    ADD CONSTRAINT maintenance_schedules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_companies user_companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_companies
    ADD CONSTRAINT user_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: companies Admins can delete their company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete their company" ON public.companies FOR DELETE USING ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::text)))));


--
-- Name: user_companies Admins can manage all company associations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all company associations" ON public.user_companies USING (true);


--
-- Name: company_users Admins can manage company users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage company users" ON public.company_users USING ((company_id IN ( SELECT company_users_1.company_id
   FROM public.company_users company_users_1
  WHERE ((company_users_1.user_id = auth.uid()) AND (company_users_1.role = 'admin'::text)))));


--
-- Name: companies Admins can update their company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::text)))));


--
-- Name: asset_disposals Users can delete company asset disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company asset disposals" ON public.asset_disposals FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: assets Users can delete company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company assets" ON public.assets FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories Users can delete company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company categories" ON public.asset_categories FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records Users can delete company depreciation records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company depreciation records" ON public.depreciation_records FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: documents Users can delete company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company documents" ON public.documents FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations Users can delete company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company locations" ON public.asset_locations FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules Users can delete company maintenance schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete company maintenance schedules" ON public.maintenance_schedules FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_disposals Users can insert company asset disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company asset disposals" ON public.asset_disposals FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: assets Users can insert company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company assets" ON public.assets FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories Users can insert company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company categories" ON public.asset_categories FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records Users can insert company depreciation records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company depreciation records" ON public.depreciation_records FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: documents Users can insert company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company documents" ON public.documents FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations Users can insert company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company locations" ON public.asset_locations FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules Users can insert company maintenance schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert company maintenance schedules" ON public.maintenance_schedules FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: companies Users can insert their own company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own company" ON public.companies FOR INSERT WITH CHECK ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'admin'::text)))));


--
-- Name: user_companies Users can insert their own company associations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own company associations" ON public.user_companies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: assets Users can read company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read company assets" ON public.assets FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: user_profiles Users can read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: companies Users can read their company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their company" ON public.companies FOR SELECT USING ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_disposals Users can update company asset disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company asset disposals" ON public.asset_disposals FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: assets Users can update company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company assets" ON public.assets FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories Users can update company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company categories" ON public.asset_categories FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records Users can update company depreciation records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company depreciation records" ON public.depreciation_records FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: documents Users can update company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company documents" ON public.documents FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations Users can update company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company locations" ON public.asset_locations FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules Users can update company maintenance schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update company maintenance schedules" ON public.maintenance_schedules FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: user_companies Users can update their own company associations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own company associations" ON public.user_companies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: asset_disposals Users can view company asset disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company asset disposals" ON public.asset_disposals FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: assets Users can view company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company assets" ON public.assets FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories Users can view company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company categories" ON public.asset_categories FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records Users can view company depreciation records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company depreciation records" ON public.depreciation_records FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: documents Users can view company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company documents" ON public.documents FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations Users can view company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company locations" ON public.asset_locations FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules Users can view company maintenance schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company maintenance schedules" ON public.maintenance_schedules FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: company_users Users can view company members; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view company members" ON public.company_users FOR SELECT USING ((company_id IN ( SELECT company_users_1.company_id
   FROM public.company_users company_users_1
  WHERE (company_users_1.user_id = auth.uid()))));


--
-- Name: user_companies Users can view their company associations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their company associations" ON public.user_companies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: companies Users can view their own company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: asset_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_disposals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_locations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: assets company assets access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company assets access" ON public.assets FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories company category access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company category access" ON public.asset_categories FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records company depreciation access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company depreciation access" ON public.depreciation_records FOR SELECT USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: asset_disposals company disposal access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company disposal access" ON public.asset_disposals FOR SELECT USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: documents company document access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company document access" ON public.documents FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations company location access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company location access" ON public.asset_locations FOR SELECT USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules company maintenance access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "company maintenance access" ON public.maintenance_schedules FOR SELECT USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: company_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

--
-- Name: depreciation_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.depreciation_records ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "read own profile" ON public.user_profiles FOR SELECT USING ((id = auth.uid()));


--
-- Name: assets user can delete company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company assets" ON public.assets FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories user can delete company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company categories" ON public.asset_categories FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records user can delete company depreciation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company depreciation" ON public.depreciation_records FOR DELETE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: asset_disposals user can delete company disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company disposals" ON public.asset_disposals FOR DELETE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: documents user can delete company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company documents" ON public.documents FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations user can delete company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company locations" ON public.asset_locations FOR DELETE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules user can delete company maintenance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can delete company maintenance" ON public.maintenance_schedules FOR DELETE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: assets user can insert company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company assets" ON public.assets FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories user can insert company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company categories" ON public.asset_categories FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records user can insert company depreciation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company depreciation" ON public.depreciation_records FOR INSERT WITH CHECK ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: asset_disposals user can insert company disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company disposals" ON public.asset_disposals FOR INSERT WITH CHECK ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: documents user can insert company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company documents" ON public.documents FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations user can insert company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company locations" ON public.asset_locations FOR INSERT WITH CHECK ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules user can insert company maintenance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can insert company maintenance" ON public.maintenance_schedules FOR INSERT WITH CHECK ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: companies user can read own company; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can read own company" ON public.companies FOR SELECT USING ((id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: company_users user can see own membership; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can see own membership" ON public.company_users FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: assets user can update company assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company assets" ON public.assets FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_categories user can update company categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company categories" ON public.asset_categories FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: depreciation_records user can update company depreciation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company depreciation" ON public.depreciation_records FOR UPDATE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: asset_disposals user can update company disposals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company disposals" ON public.asset_disposals FOR UPDATE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: documents user can update company documents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company documents" ON public.documents FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: asset_locations user can update company locations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company locations" ON public.asset_locations FOR UPDATE USING ((company_id IN ( SELECT company_users.company_id
   FROM public.company_users
  WHERE (company_users.user_id = auth.uid()))));


--
-- Name: maintenance_schedules user can update company maintenance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "user can update company maintenance" ON public.maintenance_schedules FOR UPDATE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.company_id IN ( SELECT company_users.company_id
           FROM public.company_users
          WHERE (company_users.user_id = auth.uid()))))));


--
-- Name: user_companies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: TABLE asset_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.asset_categories TO anon;
GRANT ALL ON TABLE public.asset_categories TO authenticated;
GRANT ALL ON TABLE public.asset_categories TO service_role;


--
-- Name: TABLE asset_locations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.asset_locations TO anon;
GRANT ALL ON TABLE public.asset_locations TO authenticated;
GRANT ALL ON TABLE public.asset_locations TO service_role;


--
-- Name: TABLE assets; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assets TO anon;
GRANT ALL ON TABLE public.assets TO authenticated;
GRANT ALL ON TABLE public.assets TO service_role;


--
-- Name: TABLE assets_with_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assets_with_details TO anon;
GRANT ALL ON TABLE public.assets_with_details TO authenticated;
GRANT ALL ON TABLE public.assets_with_details TO service_role;


--
-- Name: FUNCTION get_my_company_assets(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_my_company_assets() TO anon;
GRANT ALL ON FUNCTION public.get_my_company_assets() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_company_assets() TO service_role;


--
-- Name: FUNCTION get_user_company_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_company_id() TO anon;
GRANT ALL ON FUNCTION public.get_user_company_id() TO authenticated;
GRANT ALL ON FUNCTION public.get_user_company_id() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION is_company_admin(company_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_company_admin(company_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_company_admin(company_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_company_admin(company_id uuid) TO service_role;


--
-- Name: TABLE asset_disposals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.asset_disposals TO anon;
GRANT ALL ON TABLE public.asset_disposals TO authenticated;
GRANT ALL ON TABLE public.asset_disposals TO service_role;


--
-- Name: TABLE companies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.companies TO anon;
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;


--
-- Name: TABLE company_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.company_users TO anon;
GRANT ALL ON TABLE public.company_users TO authenticated;
GRANT ALL ON TABLE public.company_users TO service_role;


--
-- Name: TABLE depreciation_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.depreciation_records TO anon;
GRANT ALL ON TABLE public.depreciation_records TO authenticated;
GRANT ALL ON TABLE public.depreciation_records TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE inventory_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.inventory_items TO anon;
GRANT ALL ON TABLE public.inventory_items TO authenticated;
GRANT ALL ON TABLE public.inventory_items TO service_role;


--
-- Name: TABLE maintenance_schedules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.maintenance_schedules TO anon;
GRANT ALL ON TABLE public.maintenance_schedules TO authenticated;
GRANT ALL ON TABLE public.maintenance_schedules TO service_role;


--
-- Name: TABLE user_companies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_companies TO anon;
GRANT ALL ON TABLE public.user_companies TO authenticated;
GRANT ALL ON TABLE public.user_companies TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE user_company_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_company_info TO anon;
GRANT ALL ON TABLE public.user_company_info TO authenticated;
GRANT ALL ON TABLE public.user_company_info TO service_role;


--
-- Name: TABLE user_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_preferences TO anon;
GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.user_preferences TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
