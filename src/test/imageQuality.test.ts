import { describe, expect, it } from 'vitest';
import { assessImageData } from '../utils/imageQuality';

const makeImageData = (width: number, height: number, pixel: (x: number, y: number) => [number, number, number]) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const [r, g, b] = pixel(x, y);
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
  return { data, width, height } as ImageData;
};

describe('assessImageData', () => {
  it('accepts sufficiently sharp, bright, high-contrast images', () => {
    const image = makeImageData(640, 640, (x, y) => ((x + y) % 2 === 0 ? [20, 20, 20] : [230, 230, 230]));
    const result = assessImageData(image);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects low-resolution images', () => {
    const image = makeImageData(320, 320, (x, y) => ((x + y) % 2 === 0 ? [20, 20, 20] : [230, 230, 230]));
    const result = assessImageData(image);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/resolution/i);
  });

  it('rejects dark images', () => {
    const image = makeImageData(640, 640, () => [10, 10, 10]);
    const result = assessImageData(image);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/dark/i);
  });

  it('rejects blurry or flat images', () => {
    const image = makeImageData(640, 640, () => [128, 128, 128]);
    const result = assessImageData(image);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/contrast|blurry/i);
  });
});
