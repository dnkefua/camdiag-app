export const DOCUMENT_LIMITS = {
  files: 15,
  fileBytes: 6 * 1024 * 1024,
  totalBytes: 24 * 1024 * 1024,
} as const;
// Raster pages provide explicit page counts. PDF/TIFF remain disabled until their
// actual page counts can be checked before the approved processing boundary.
export const ACCEPTED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const validateDocumentFiles = (
  existing: readonly { size: number }[],
  incoming: readonly { size: number; type: string }[]
): string | null => {
  if (existing.length + incoming.length > DOCUMENT_LIMITS.files)
    return 'A document can contain at most 15 image pages.';
  if (
    incoming.some(
      (file) =>
        !ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])
    )
  )
    return 'Use JPEG, PNG or WebP images. PDF/TIFF input is not yet supported in the reviewed workflow.';
  if (incoming.some((file) => file.size <= 0 || file.size > DOCUMENT_LIMITS.fileBytes))
    return 'Each page must be between 1 byte and 6 MiB.';
  if (
    [...existing, ...incoming].reduce((sum, file) => sum + file.size, 0) >
    DOCUMENT_LIMITS.totalBytes
  )
    return 'The selected pages exceed the 24 MiB document limit.';
  return null;
};
