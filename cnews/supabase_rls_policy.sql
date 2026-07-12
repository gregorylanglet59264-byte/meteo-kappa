-- ==========================================
-- Supabase Storage RLS Policies Configuration
-- ==========================================
-- 
-- Copiez-collez ces commandes dans l'éditeur SQL de votre console Supabase 
-- (https://supabase.com -> Votre Projet -> SQL Editor -> New Query) 
-- puis cliquez sur "Run".
--
-- Cela permettra à l'application et au script automatique de téléverser 
-- le bulletin PDF directement sans être bloqués par les règles de sécurité (RLS).

-- 1. Autoriser tout le monde (accès public anonyme) à insérer des fichiers dans le bucket 'vigilance-captures'
CREATE POLICY "Allow public insert to vigilance-captures"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'vigilance-captures' );

-- 2. Autoriser tout le monde (accès public anonyme) à modifier/remplacer des fichiers existants dans 'vigilance-captures'
CREATE POLICY "Allow public update to vigilance-captures"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'vigilance-captures' )
WITH CHECK ( bucket_id = 'vigilance-captures' );

-- 3. Autoriser tout le monde à lire les fichiers du bucket (si ce n'est pas déjà configuré)
CREATE POLICY "Allow public read from vigilance-captures"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vigilance-captures' );
