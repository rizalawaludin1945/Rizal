export function stampPhotoWithWatermark(
  imageSource: string | File,
  metadata: {
    outletName: string;
    salesmanName: string;
    lat: number;
    lng: number;
    type: 'CHECK_IN' | 'CHECK_OUT' | 'DOCUMENT';
  }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const renderOnCanvas = (loadedImg: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
        return;
      }

      // Max width 800 for mobile bandwidth
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / loadedImg.width);
      canvas.width = loadedImg.width * scale;
      canvas.height = loadedImg.height * scale;

      // Draw original image
      ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);

      // Draw bottom watermark band
      const bandHeight = 70;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, canvas.height - bandHeight, canvas.width, bandHeight);

      // Add accent border on watermark
      ctx.fillStyle = metadata.type === 'CHECK_IN' ? '#3b82f6' : (metadata.type === 'CHECK_OUT' ? '#10b981' : '#f59e0b');
      ctx.fillRect(0, canvas.height - bandHeight, canvas.width, 3);

      // Add text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(metadata.outletName, 14, canvas.height - bandHeight + 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
      ctx.fillText(`Sales: ${metadata.salesmanName} | ${metadata.type}`, 14, canvas.height - bandHeight + 40);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(`GPS: ${metadata.lat.toFixed(5)}, ${metadata.lng.toFixed(5)} • ${nowStr}`, 14, canvas.height - bandHeight + 58);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    if (typeof imageSource === 'string') {
      img.onload = () => renderOnCanvas(img);
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => renderOnCanvas(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageSource);
    }
  });
}
