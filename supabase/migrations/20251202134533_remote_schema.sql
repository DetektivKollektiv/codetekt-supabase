-- Migration: create_profiles_table (ÜBERARBEITET)

DROP EXTENSION IF EXISTS "pg_net";

CREATE TABLE "public"."profiles" (
  "id" uuid NOT NULL,
  "updated_at" timestamp with time zone,
  "username" text,
  "is_admin" boolean NOT NULL DEFAULT false
);

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY USING INDEX "profiles_pkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE "public"."profiles" VALIDATE CONSTRAINT "profiles_id_fkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_username_key" UNIQUE USING INDEX "profiles_username_key";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "username_length" CHECK ((char_length(username) >= 3)) NOT VALID;
ALTER TABLE "public"."profiles" VALIDATE CONSTRAINT "username_length";

SET check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, NULL);
  RETURN new;
END;
$function$;

GRANT DELETE ON TABLE "public"."profiles" TO "anon";
GRANT INSERT ON TABLE "public"."profiles" TO "anon";
GRANT REFERENCES ON TABLE "public"."profiles" TO "anon";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";
GRANT TRIGGER ON TABLE "public"."profiles" TO "anon";
GRANT TRUNCATE ON TABLE "public"."profiles" TO "anon";
GRANT UPDATE ON TABLE "public"."profiles" TO "anon";

GRANT DELETE ON TABLE "public"."profiles" TO "authenticated";
GRANT INSERT ON TABLE "public"."profiles" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."profiles" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."profiles" TO "authenticated";
GRANT UPDATE ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE ON TABLE "public"."profiles" TO "service_role";
GRANT INSERT ON TABLE "public"."profiles" TO "service_role";
GRANT REFERENCES ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "service_role";
GRANT TRIGGER ON TABLE "public"."profiles" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."profiles" TO "service_role";
GRANT UPDATE ON TABLE "public"."profiles" TO "service_role";

CREATE POLICY "Public profiles are viewable by everyone"
  ON "public"."profiles"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON "public"."profiles"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = id);

CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Storage policies bleiben unverändert
CREATE POLICY "Anyone can upload an avatar"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((bucket_id = 'avatars'::text));

CREATE POLICY "Avatar images are publicly accessible"
  ON "storage"."objects"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((bucket_id = 'avatars'::text));