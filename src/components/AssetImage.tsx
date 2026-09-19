import React from 'react';
import { useAsset } from '../contexts/AssetContext';

interface AssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const AssetImage: React.FC<AssetImageProps> = ({ src, ...props }) => {
  const { customAssets } = useAsset();
  
  // If the src exists in our custom assets mapping, use it. Otherwise fallback to original src.
  const finalSrc = customAssets[src] || src;

  return <img src={finalSrc} {...props} />;
};
