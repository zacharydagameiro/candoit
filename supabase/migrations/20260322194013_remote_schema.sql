create extension if not exists "vector" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."discovery_message_role" as enum ('user', 'assistant', 'system', 'tool');

create type "public"."requirement_candidate_status" as enum ('proposed', 'accepted', 'discarded');

create type "public"."requirement_match_status" as enum ('candidate', 'shortlisted', 'rejected');

drop index if exists "public"."idx_reqsupp_requirement_id";

drop index if exists "public"."idx_suppliers_website";

alter table "public"."requirements" alter column "status" drop default;

alter type "public"."requirement_status" rename to "requirement_status__old_version_to_be_dropped";

create type "public"."requirement_status" as enum ('ready', 'finding', 'found', 'archived', 'queued');


  create table "public"."discovery_messages" (
    "id" uuid not null default gen_random_uuid(),
    "thread_id" uuid not null,
    "role" public.discovery_message_role not null,
    "content" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."discovery_messages" enable row level security;


  create table "public"."discovery_threads" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "title" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."discovery_threads" enable row level security;


  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "name" text not null,
    "category" text,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."products" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "display_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."profiles" enable row level security;


  create table "public"."requirement_candidates" (
    "id" uuid not null default gen_random_uuid(),
    "thread_id" uuid not null,
    "product_id" uuid not null,
    "source_message_id" uuid,
    "title" text not null,
    "description" text,
    "category" text,
    "status" public.requirement_candidate_status not null default 'proposed'::public.requirement_candidate_status,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."requirement_candidates" enable row level security;


  create table "public"."supplier_capabilities" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "capability_type" text not null,
    "materials" text[] not null default '{}'::text[],
    "formats" text[] not null default '{}'::text[],
    "min_moq" numeric,
    "max_moq" numeric,
    "certifications" text[] not null default '{}'::text[],
    "regions_served" text[] not null default '{}'::text[],
    "description" text,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."supplier_capabilities" enable row level security;


  create table "public"."supplier_search_documents" (
    "id" uuid not null default gen_random_uuid(),
    "supplier_id" uuid not null,
    "capability_id" uuid,
    "document_text" text not null,
    "embedding" extensions.vector(1536),
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."supplier_search_documents" enable row level security;

alter table "public"."requirements" alter column status type "public"."requirement_status" using status::text::"public"."requirement_status";

alter table "public"."requirements" alter column "status" set default 'draft'::public.requirement_status;

drop type "public"."requirement_status__old_version_to_be_dropped";

alter table "public"."requirement_suppliers" add column "notes" text;

alter table "public"."requirement_suppliers" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."requirement_suppliers" alter column "fit_score" set data type numeric(5,2) using "fit_score"::numeric(5,2);

alter table "public"."requirement_suppliers" alter column "match_status" set default 'candidate'::public.requirement_match_status;

alter table "public"."requirement_suppliers" alter column "match_status" set data type public.requirement_match_status using "match_status"::text::public.requirement_match_status;

alter table "public"."requirement_suppliers" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."requirement_suppliers" enable row level security;

alter table "public"."requirements" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."requirements" alter column "status" set default 'ready'::public.requirement_status;

alter table "public"."requirements" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."requirements" enable row level security;

alter table "public"."suppliers" add column "contact_url" text;

alter table "public"."suppliers" add column "created_by_user_id" uuid default auth.uid();

alter table "public"."suppliers" add column "region" text;

alter table "public"."suppliers" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."suppliers" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."suppliers" alter column "website" drop not null;

alter table "public"."suppliers" enable row level security;

drop type "public"."supplier_match_status";

CREATE INDEX discovery_messages_created_at_idx ON public.discovery_messages USING btree (created_at);

CREATE UNIQUE INDEX discovery_messages_pkey ON public.discovery_messages USING btree (id);

CREATE INDEX discovery_messages_thread_id_idx ON public.discovery_messages USING btree (thread_id);

CREATE INDEX discovery_threads_created_at_idx ON public.discovery_threads USING btree (created_at);

CREATE UNIQUE INDEX discovery_threads_pkey ON public.discovery_threads USING btree (id);

CREATE INDEX discovery_threads_product_id_idx ON public.discovery_threads USING btree (product_id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE INDEX products_user_id_idx ON public.products USING btree (user_id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX requirement_candidates_created_at_idx ON public.requirement_candidates USING btree (created_at);

CREATE UNIQUE INDEX requirement_candidates_pkey ON public.requirement_candidates USING btree (id);

CREATE INDEX requirement_candidates_product_id_idx ON public.requirement_candidates USING btree (product_id);

CREATE INDEX requirement_candidates_thread_id_idx ON public.requirement_candidates USING btree (thread_id);

CREATE INDEX requirement_suppliers_requirement_id_idx ON public.requirement_suppliers USING btree (requirement_id);

CREATE INDEX requirement_suppliers_supplier_id_idx ON public.requirement_suppliers USING btree (supplier_id);

CREATE INDEX requirements_product_id_idx ON public.requirements USING btree (product_id);

CREATE UNIQUE INDEX supplier_capabilities_pkey ON public.supplier_capabilities USING btree (id);

CREATE INDEX supplier_capabilities_supplier_id_idx ON public.supplier_capabilities USING btree (supplier_id);

CREATE INDEX supplier_capabilities_type_status_idx ON public.supplier_capabilities USING btree (capability_type, status);

CREATE INDEX supplier_search_documents_capability_id_idx ON public.supplier_search_documents USING btree (capability_id);

CREATE INDEX supplier_search_documents_embedding_idx ON public.supplier_search_documents USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists='100');

CREATE UNIQUE INDEX supplier_search_documents_pkey ON public.supplier_search_documents USING btree (id);

CREATE INDEX supplier_search_documents_supplier_id_idx ON public.supplier_search_documents USING btree (supplier_id);

CREATE INDEX suppliers_created_by_user_id_idx ON public.suppliers USING btree (created_by_user_id);

alter table "public"."discovery_messages" add constraint "discovery_messages_pkey" PRIMARY KEY using index "discovery_messages_pkey";

alter table "public"."discovery_threads" add constraint "discovery_threads_pkey" PRIMARY KEY using index "discovery_threads_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."requirement_candidates" add constraint "requirement_candidates_pkey" PRIMARY KEY using index "requirement_candidates_pkey";

alter table "public"."supplier_capabilities" add constraint "supplier_capabilities_pkey" PRIMARY KEY using index "supplier_capabilities_pkey";

alter table "public"."supplier_search_documents" add constraint "supplier_search_documents_pkey" PRIMARY KEY using index "supplier_search_documents_pkey";

alter table "public"."discovery_messages" add constraint "discovery_messages_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.discovery_threads(id) ON DELETE CASCADE not valid;

alter table "public"."discovery_messages" validate constraint "discovery_messages_thread_id_fkey";

alter table "public"."discovery_threads" add constraint "discovery_threads_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."discovery_threads" validate constraint "discovery_threads_product_id_fkey";

alter table "public"."products" add constraint "products_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."requirement_candidates" add constraint "requirement_candidates_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."requirement_candidates" validate constraint "requirement_candidates_product_id_fkey";

alter table "public"."requirement_candidates" add constraint "requirement_candidates_source_message_id_fkey" FOREIGN KEY (source_message_id) REFERENCES public.discovery_messages(id) ON DELETE SET NULL not valid;

alter table "public"."requirement_candidates" validate constraint "requirement_candidates_source_message_id_fkey";

alter table "public"."requirement_candidates" add constraint "requirement_candidates_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.discovery_threads(id) ON DELETE CASCADE not valid;

alter table "public"."requirement_candidates" validate constraint "requirement_candidates_thread_id_fkey";

alter table "public"."requirements" add constraint "requirements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."requirements" validate constraint "requirements_product_id_fkey";

alter table "public"."supplier_capabilities" add constraint "supplier_capabilities_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."supplier_capabilities" validate constraint "supplier_capabilities_status_check";

alter table "public"."supplier_capabilities" add constraint "supplier_capabilities_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_capabilities" validate constraint "supplier_capabilities_supplier_id_fkey";

alter table "public"."supplier_search_documents" add constraint "supplier_search_documents_capability_id_fkey" FOREIGN KEY (capability_id) REFERENCES public.supplier_capabilities(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_search_documents" validate constraint "supplier_search_documents_capability_id_fkey";

alter table "public"."supplier_search_documents" add constraint "supplier_search_documents_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_search_documents" validate constraint "supplier_search_documents_supplier_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_created_by_user_id_fkey" FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_created_by_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = nullif(excluded.display_name, ''),
        updated_at = timezone('utc', now());

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$
;

grant delete on table "public"."discovery_messages" to "anon";

grant insert on table "public"."discovery_messages" to "anon";

grant references on table "public"."discovery_messages" to "anon";

grant select on table "public"."discovery_messages" to "anon";

grant trigger on table "public"."discovery_messages" to "anon";

grant truncate on table "public"."discovery_messages" to "anon";

grant update on table "public"."discovery_messages" to "anon";

grant delete on table "public"."discovery_messages" to "authenticated";

grant insert on table "public"."discovery_messages" to "authenticated";

grant references on table "public"."discovery_messages" to "authenticated";

grant select on table "public"."discovery_messages" to "authenticated";

grant trigger on table "public"."discovery_messages" to "authenticated";

grant truncate on table "public"."discovery_messages" to "authenticated";

grant update on table "public"."discovery_messages" to "authenticated";

grant delete on table "public"."discovery_messages" to "service_role";

grant insert on table "public"."discovery_messages" to "service_role";

grant references on table "public"."discovery_messages" to "service_role";

grant select on table "public"."discovery_messages" to "service_role";

grant trigger on table "public"."discovery_messages" to "service_role";

grant truncate on table "public"."discovery_messages" to "service_role";

grant update on table "public"."discovery_messages" to "service_role";

grant delete on table "public"."discovery_threads" to "anon";

grant insert on table "public"."discovery_threads" to "anon";

grant references on table "public"."discovery_threads" to "anon";

grant select on table "public"."discovery_threads" to "anon";

grant trigger on table "public"."discovery_threads" to "anon";

grant truncate on table "public"."discovery_threads" to "anon";

grant update on table "public"."discovery_threads" to "anon";

grant delete on table "public"."discovery_threads" to "authenticated";

grant insert on table "public"."discovery_threads" to "authenticated";

grant references on table "public"."discovery_threads" to "authenticated";

grant select on table "public"."discovery_threads" to "authenticated";

grant trigger on table "public"."discovery_threads" to "authenticated";

grant truncate on table "public"."discovery_threads" to "authenticated";

grant update on table "public"."discovery_threads" to "authenticated";

grant delete on table "public"."discovery_threads" to "service_role";

grant insert on table "public"."discovery_threads" to "service_role";

grant references on table "public"."discovery_threads" to "service_role";

grant select on table "public"."discovery_threads" to "service_role";

grant trigger on table "public"."discovery_threads" to "service_role";

grant truncate on table "public"."discovery_threads" to "service_role";

grant update on table "public"."discovery_threads" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."requirement_candidates" to "anon";

grant insert on table "public"."requirement_candidates" to "anon";

grant references on table "public"."requirement_candidates" to "anon";

grant select on table "public"."requirement_candidates" to "anon";

grant trigger on table "public"."requirement_candidates" to "anon";

grant truncate on table "public"."requirement_candidates" to "anon";

grant update on table "public"."requirement_candidates" to "anon";

grant delete on table "public"."requirement_candidates" to "authenticated";

grant insert on table "public"."requirement_candidates" to "authenticated";

grant references on table "public"."requirement_candidates" to "authenticated";

grant select on table "public"."requirement_candidates" to "authenticated";

grant trigger on table "public"."requirement_candidates" to "authenticated";

grant truncate on table "public"."requirement_candidates" to "authenticated";

grant update on table "public"."requirement_candidates" to "authenticated";

grant delete on table "public"."requirement_candidates" to "service_role";

grant insert on table "public"."requirement_candidates" to "service_role";

grant references on table "public"."requirement_candidates" to "service_role";

grant select on table "public"."requirement_candidates" to "service_role";

grant trigger on table "public"."requirement_candidates" to "service_role";

grant truncate on table "public"."requirement_candidates" to "service_role";

grant update on table "public"."requirement_candidates" to "service_role";

grant delete on table "public"."supplier_capabilities" to "anon";

grant insert on table "public"."supplier_capabilities" to "anon";

grant references on table "public"."supplier_capabilities" to "anon";

grant select on table "public"."supplier_capabilities" to "anon";

grant trigger on table "public"."supplier_capabilities" to "anon";

grant truncate on table "public"."supplier_capabilities" to "anon";

grant update on table "public"."supplier_capabilities" to "anon";

grant delete on table "public"."supplier_capabilities" to "authenticated";

grant insert on table "public"."supplier_capabilities" to "authenticated";

grant references on table "public"."supplier_capabilities" to "authenticated";

grant select on table "public"."supplier_capabilities" to "authenticated";

grant trigger on table "public"."supplier_capabilities" to "authenticated";

grant truncate on table "public"."supplier_capabilities" to "authenticated";

grant update on table "public"."supplier_capabilities" to "authenticated";

grant delete on table "public"."supplier_capabilities" to "service_role";

grant insert on table "public"."supplier_capabilities" to "service_role";

grant references on table "public"."supplier_capabilities" to "service_role";

grant select on table "public"."supplier_capabilities" to "service_role";

grant trigger on table "public"."supplier_capabilities" to "service_role";

grant truncate on table "public"."supplier_capabilities" to "service_role";

grant update on table "public"."supplier_capabilities" to "service_role";

grant delete on table "public"."supplier_search_documents" to "anon";

grant insert on table "public"."supplier_search_documents" to "anon";

grant references on table "public"."supplier_search_documents" to "anon";

grant select on table "public"."supplier_search_documents" to "anon";

grant trigger on table "public"."supplier_search_documents" to "anon";

grant truncate on table "public"."supplier_search_documents" to "anon";

grant update on table "public"."supplier_search_documents" to "anon";

grant delete on table "public"."supplier_search_documents" to "authenticated";

grant insert on table "public"."supplier_search_documents" to "authenticated";

grant references on table "public"."supplier_search_documents" to "authenticated";

grant select on table "public"."supplier_search_documents" to "authenticated";

grant trigger on table "public"."supplier_search_documents" to "authenticated";

grant truncate on table "public"."supplier_search_documents" to "authenticated";

grant update on table "public"."supplier_search_documents" to "authenticated";

grant delete on table "public"."supplier_search_documents" to "service_role";

grant insert on table "public"."supplier_search_documents" to "service_role";

grant references on table "public"."supplier_search_documents" to "service_role";

grant select on table "public"."supplier_search_documents" to "service_role";

grant trigger on table "public"."supplier_search_documents" to "service_role";

grant truncate on table "public"."supplier_search_documents" to "service_role";

grant update on table "public"."supplier_search_documents" to "service_role";


  create policy "Users can create own discovery messages"
  on "public"."discovery_messages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.discovery_threads
     JOIN public.products ON ((products.id = discovery_threads.product_id)))
  WHERE ((discovery_threads.id = discovery_messages.thread_id) AND (products.user_id = auth.uid())))));



  create policy "Users can delete own discovery messages"
  on "public"."discovery_messages"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.discovery_threads
     JOIN public.products ON ((products.id = discovery_threads.product_id)))
  WHERE ((discovery_threads.id = discovery_messages.thread_id) AND (products.user_id = auth.uid())))));



  create policy "Users can update own discovery messages"
  on "public"."discovery_messages"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.discovery_threads
     JOIN public.products ON ((products.id = discovery_threads.product_id)))
  WHERE ((discovery_threads.id = discovery_messages.thread_id) AND (products.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.discovery_threads
     JOIN public.products ON ((products.id = discovery_threads.product_id)))
  WHERE ((discovery_threads.id = discovery_messages.thread_id) AND (products.user_id = auth.uid())))));



  create policy "Users can view own discovery messages"
  on "public"."discovery_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.discovery_threads
     JOIN public.products ON ((products.id = discovery_threads.product_id)))
  WHERE ((discovery_threads.id = discovery_messages.thread_id) AND (products.user_id = auth.uid())))));



  create policy "Users can create own discovery threads"
  on "public"."discovery_threads"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = discovery_threads.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can delete own discovery threads"
  on "public"."discovery_threads"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = discovery_threads.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can update own discovery threads"
  on "public"."discovery_threads"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = discovery_threads.product_id) AND (products.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = discovery_threads.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can view own discovery threads"
  on "public"."discovery_threads"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = discovery_threads.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can create own products"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can delete own products"
  on "public"."products"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can update own products"
  on "public"."products"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Users can view own products"
  on "public"."products"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "Users can create own requirement candidates"
  on "public"."requirement_candidates"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirement_candidates.product_id) AND (products.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM public.discovery_threads
  WHERE ((discovery_threads.id = requirement_candidates.thread_id) AND (discovery_threads.product_id = requirement_candidates.product_id))))));



  create policy "Users can delete own requirement candidates"
  on "public"."requirement_candidates"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirement_candidates.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can update own requirement candidates"
  on "public"."requirement_candidates"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirement_candidates.product_id) AND (products.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirement_candidates.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can view own requirement candidates"
  on "public"."requirement_candidates"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirement_candidates.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can create requirement supplier links for own requirement"
  on "public"."requirement_suppliers"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.requirements
     JOIN public.products ON ((products.id = requirements.product_id)))
  WHERE ((requirements.id = requirement_suppliers.requirement_id) AND (products.user_id = auth.uid())))));



  create policy "Users can delete requirement supplier links for own requirement"
  on "public"."requirement_suppliers"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.requirements
     JOIN public.products ON ((products.id = requirements.product_id)))
  WHERE ((requirements.id = requirement_suppliers.requirement_id) AND (products.user_id = auth.uid())))));



  create policy "Users can update requirement supplier links for own requirement"
  on "public"."requirement_suppliers"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.requirements
     JOIN public.products ON ((products.id = requirements.product_id)))
  WHERE ((requirements.id = requirement_suppliers.requirement_id) AND (products.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (public.requirements
     JOIN public.products ON ((products.id = requirements.product_id)))
  WHERE ((requirements.id = requirement_suppliers.requirement_id) AND (products.user_id = auth.uid())))));



  create policy "Users can view requirement supplier links for own requirements"
  on "public"."requirement_suppliers"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.requirements
     JOIN public.products ON ((products.id = requirements.product_id)))
  WHERE ((requirements.id = requirement_suppliers.requirement_id) AND (products.user_id = auth.uid())))));



  create policy "Users can create own requirements"
  on "public"."requirements"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirements.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can delete own requirements"
  on "public"."requirements"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirements.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can update own requirements"
  on "public"."requirements"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirements.product_id) AND (products.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirements.product_id) AND (products.user_id = auth.uid())))));



  create policy "Users can view own requirements"
  on "public"."requirements"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = requirements.product_id) AND (products.user_id = auth.uid())))));



  create policy "Authenticated users can create capabilities for own suppliers"
  on "public"."supplier_capabilities"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_capabilities.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Authenticated users can view supplier capabilities"
  on "public"."supplier_capabilities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can delete capabilities for own suppliers"
  on "public"."supplier_capabilities"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_capabilities.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Users can update capabilities for own suppliers"
  on "public"."supplier_capabilities"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_capabilities.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_capabilities.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Authenticated users can create search docs for own suppliers"
  on "public"."supplier_search_documents"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_search_documents.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Authenticated users can view supplier search documents"
  on "public"."supplier_search_documents"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can delete search docs for own suppliers"
  on "public"."supplier_search_documents"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_search_documents.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Users can update search docs for own suppliers"
  on "public"."supplier_search_documents"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_search_documents.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM public.suppliers
  WHERE ((suppliers.id = supplier_search_documents.supplier_id) AND (suppliers.created_by_user_id = auth.uid())))));



  create policy "Authenticated users can create suppliers"
  on "public"."suppliers"
  as permissive
  for insert
  to authenticated
with check ((created_by_user_id = auth.uid()));



  create policy "Authenticated users can view suppliers"
  on "public"."suppliers"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER discovery_messages_set_updated_at BEFORE UPDATE ON public.discovery_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER discovery_threads_set_updated_at BEFORE UPDATE ON public.discovery_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_candidates_set_updated_at BEFORE UPDATE ON public.requirement_candidates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirement_suppliers_set_updated_at BEFORE UPDATE ON public.requirement_suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER requirements_set_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER supplier_capabilities_set_updated_at BEFORE UPDATE ON public.supplier_capabilities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER supplier_search_documents_set_updated_at BEFORE UPDATE ON public.supplier_search_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


