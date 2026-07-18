'use client';

import dynamic from 'next/dynamic';
import { Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });
import { formatImageUrl } from '@/lib/cloudinary';

import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

export interface MediaItem {
  id: string;
  url: string;
  type: string;
  description: string;
  date: string;
  user: { name: string; colorTheme: string };
  albumId?: string | null;
  isPinned?: boolean;
}

interface GalleryLightboxProps {
  media: MediaItem[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDelete?: (id: string) => void;
  currentUserName?: string;
}

export function GalleryLightbox({
  media,
  open,
  index,
  onClose,
  onIndexChange,
  onDelete,
  currentUserName,
}: GalleryLightboxProps) {
  const slides = media.map((item) => {
    const formattedUrl = formatImageUrl(item.url);
    if (item.type === 'video') {
      const poster = formattedUrl.replace('/upload/', '/upload/so_1,f_jpg/').replace(/\.\w+$/, '.jpg');
      return {
        type: 'video' as const,
        width: 1280,
        height: 720,
        poster,
        sources: [
          {
            src: formattedUrl,
            type: "video/mp4"
          }
        ],
        itemData: item
      };
    }
    return {
      src: formattedUrl,
      itemData: item
    };
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Video]}
      zoom={{
        maxZoomPixelRatio: 4,
        scrollToZoom: true,
        doubleTapDelay: 300,
      }}
      on={{
        view: ({ index: newIndex }) => onIndexChange(newIndex),
      }}
      toolbar={{
        buttons: [
          (() => {
            const item = slides[index]?.itemData as MediaItem;
            if (item?.user?.name === currentUserName && onDelete) {
              return (
                <button 
                  key="delete"
                  type="button"
                  title="Eliminar"
                  className="yarl__button"
                  style={{ padding: '8px' }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm('¿Estás seguro de eliminar este recuerdo?')) return;
                    onDelete(item.id);
                  }}
                >
                  <Trash2 className="w-5 h-5 text-red-500 hover:text-red-400" />
                </button>
              );
            }
            return null;
          })(),
          "close"
        ]
      }}
      render={{
        iconClose: () => <X className="w-6 h-6" />,
        slideFooter: () => {
          const item = slides[index]?.itemData as MediaItem;
          if (!item) return null;
          return (
            <div className="w-full text-center px-4 pb-6 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
              {item.description && (
                <p className="text-white text-lg font-medium mb-1">{item.description}</p>
              )}
              <p className="text-white/70 text-sm">
                Subido por {item.user?.name} el {format(new Date(item.date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          );
        }
      }}
    />
  );
}
