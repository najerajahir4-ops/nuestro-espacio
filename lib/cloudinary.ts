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

/**
 * Transforms a Cloudinary URL to return a resized and optimized image version,
 * automatically applying q_auto and f_auto to compress and convert to modern formats.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined, 
  options: { width?: number; height?: number; crop?: string; cropFace?: boolean } = {}
): string {
  if (!url) return '';
  let formattedUrl = formatImageUrl(url);
  
  if (formattedUrl.includes('cloudinary.com') && formattedUrl.includes('/upload/')) {
    const { width, height, crop = 'fill', cropFace = false } = options;
    let params = 'q_auto,f_auto';
    
    if (width || height) {
      params += `,c_${crop}`;
      if (width) params += `,w_${width}`;
      if (height) params += `,h_${height}`;
      if (cropFace) params += ',g_face'; // Auto center faces on avatars
    }
    
    formattedUrl = formattedUrl.replace('/upload/', `/upload/${params}/`);
  }
  
  return formattedUrl;
}

