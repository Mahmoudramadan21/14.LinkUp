import html2canvas from 'html2canvas';

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Please upload a valid image file.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB.';
  }
  return null;
};

export const generateStoryCanvas = async (
  previewElement: HTMLDivElement,
  dimensions: { width: number; height: number }
): Promise<File> => {
  const canvas = await html2canvas(previewElement, {
    useCORS: true,
    backgroundColor: null,
    scale: 2,
    width: dimensions.width,
    height: dimensions.height,
  });

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = 1080;
  finalCanvas.height = 1920;
  const ctx = finalCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const scale = Math.min(finalCanvas.width / canvas.width, finalCanvas.height / canvas.height);
  const scaledWidth = canvas.width * scale;
  const scaledHeight = canvas.height * scale;
  const offsetX = (finalCanvas.width - scaledWidth) / 2;
  const offsetY = (finalCanvas.height - scaledHeight) / 2;

  ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

  const imageDataUrl = finalCanvas.toDataURL('image/png');
  const blob = await (await fetch(imageDataUrl)).blob();
  return new File([blob], 'story.png', { type: 'image/png' });
};

export const centerElement = (
  parent: HTMLDivElement,
  child: HTMLDivElement
): { x: number; y: number } => {
  const parentRect = parent.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const centerX = (parentRect.width - childRect.width) / 2;
  const centerY = (parentRect.height - childRect.height) / 2;
  return { x: centerX, y: centerY };
};