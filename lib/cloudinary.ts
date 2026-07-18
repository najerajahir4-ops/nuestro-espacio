/**
 * Utility function to handle formatting of Cloudinary URLs,
 * specifically converting HEIC/HEIF files to JPG dynamically
 * so that browsers can render them properly.
 */
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If it's a Cloudinary URL and ends with HEIC/HEIF, dynamically convert it to JPG
  if (url.includes('cloudinary.com') && /\.(heic|heif)(\?|$)/i.test(url)) {
    return url.replace(/\.(heic|heif)(\?|$)/i, '.jpg$2');
  }
  
  return url;
}
