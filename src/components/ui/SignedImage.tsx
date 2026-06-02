import { ImgHTMLAttributes } from 'react';
import { useSignedImageUrl } from '@/hooks/useSignedImageUrl';

interface SignedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  storedUrl: string | null | undefined;
}

export function SignedImage({ storedUrl, ...rest }: SignedImageProps) {
  const url = useSignedImageUrl(storedUrl);
  if (!url) {
    return <div className={(rest.className || '') + ' bg-muted/40 animate-pulse'} style={rest.style} />;
  }
  return <img src={url} {...rest} />;
}
