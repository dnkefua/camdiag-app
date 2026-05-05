export interface ImageQualityResult {
  ok: boolean;
  score: number;
  width: number;
  height: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  issues: string[];
}

const MIN_DIMENSION = 480;
const MIN_BRIGHTNESS = 35;
const MAX_BRIGHTNESS = 235;
const MIN_CONTRAST = 18;
const MIN_SHARPNESS = 7;

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const assessImageData = (imageData: ImageData): ImageQualityResult => {
  const { data, width, height } = imageData;
  const issues: string[] = [];
  const pixels = width * height;
  let sum = 0;
  let sumSquares = 0;
  let sharpnessSum = 0;
  let sharpnessSamples = 0;

  const luminanceAt = (index: number) => (
    0.299 * (data[index] ?? 0) + 0.587 * (data[index + 1] ?? 0) + 0.114 * (data[index + 2] ?? 0)
  );

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = luminanceAt(i);
      sum += lum;
      sumSquares += lum * lum;

      if (x > 0 && y > 0) {
        const left = luminanceAt((y * width + x - 1) * 4);
        const top = luminanceAt(((y - 1) * width + x) * 4);
        sharpnessSum += Math.abs(lum - left) + Math.abs(lum - top);
        sharpnessSamples += 2;
      }
    }
  }

  const brightness = sum / pixels;
  const variance = Math.max(0, (sumSquares / pixels) - (brightness * brightness));
  const contrast = Math.sqrt(variance);
  const sharpness = sharpnessSamples > 0 ? sharpnessSum / sharpnessSamples : 0;

  if (Math.min(width, height) < MIN_DIMENSION) {
    issues.push('Image resolution is too low. Retake closer to the document.');
  }
  if (brightness < MIN_BRIGHTNESS) {
    issues.push('Image is too dark. Add light or enable flash.');
  }
  if (brightness > MAX_BRIGHTNESS) {
    issues.push('Image is overexposed. Reduce glare and retake.');
  }
  if (contrast < MIN_CONTRAST) {
    issues.push('Image contrast is too low. Place the document on a plain background.');
  }
  if (sharpness < MIN_SHARPNESS) {
    issues.push('Image may be blurry. Hold still and retake.');
  }

  const score = clampScore(
    (Math.min(width, height) / MIN_DIMENSION) * 20
    + (1 - Math.abs(brightness - 130) / 130) * 25
    + (contrast / 60) * 25
    + (sharpness / 18) * 30,
  );

  return {
    ok: issues.length === 0,
    score,
    width,
    height,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    sharpness: Math.round(sharpness),
    issues,
  };
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Could not inspect image quality. Retake the photo or choose another image.'));
  image.src = dataUrl;
});

export const validateImageQuality = async (dataUrl: string): Promise<ImageQualityResult> => {
  const image = await loadImage(dataUrl);
  const sampleWidth = Math.min(320, image.naturalWidth || image.width);
  const scale = sampleWidth / (image.naturalWidth || image.width);
  const sampleHeight = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not inspect image quality on this device.');
  }

  ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const result = assessImageData(ctx.getImageData(0, 0, sampleWidth, sampleHeight));
  return {
    ...result,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
};
