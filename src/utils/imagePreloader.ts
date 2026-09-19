export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`Gagal memuat gambar (Preload failed): ${url}`);
      resolve();
    };
  });
};

export const preloadMultipleImages = async (urls: string[]): Promise<void> => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  await Promise.all(uniqueUrls.map(url => preloadImage(url)));
};
