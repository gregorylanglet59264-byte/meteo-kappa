import { supabase } from '@/lib/supabase';

/**
 * Uploade un blob PDF sur le stockage Supabase et retourne l'URL publique.
 */
export async function uploadPdfToStorage(
  pdfBlob: Blob,
  filename: string
): Promise<string> {
  try {
    // 1. Upload du fichier directement à la racine du bucket 'bulletins'
    const { data, error: uploadError } = await supabase.storage
      .from('vigilance-captures')
      .upload(filename, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('vigilance-captures')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error: any) {
    console.error('Erreur stockage Supabase:', error);
    throw new Error(error.message || "Erreur lors de l'upload");
  }
}

/**
 * Uploade une vidéo sur le stockage Supabase et retourne l'URL publique.
 */
export async function uploadVideoToStorage(
  videoFile: File,
  filename: string = 'videohdf'
): Promise<string> {
  try {
    const { error: uploadError } = await supabase.storage
      .from('vigilance-captures')
      .upload(filename, videoFile, {
        contentType: videoFile.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('vigilance-captures')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error: any) {
    console.error('Erreur stockage vidéo Supabase:', error);
    throw new Error(error.message || "Erreur lors de l'upload de la vidéo");
  }
}
/**
 * Uploade une image sur le stockage Supabase et retourne l'URL publique.
 */
export async function uploadImageToStorage(
  imageFile: File,
  filename: string
): Promise<string> {
  try {
    const { error: uploadError } = await supabase.storage
      .from('vigilance-captures')
      .upload(filename, imageFile, {
        contentType: imageFile.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('vigilance-captures')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error: any) {
    console.error('Erreur stockage image Supabase:', error);
    throw new Error(error.message || "Erreur lors de l'upload de l'image");
  }
}
