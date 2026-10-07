const PRIVATE_BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";

export function getAccessibleBlobUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.endsWith(PRIVATE_BLOB_HOST_SUFFIX)) {
      return `/api/files?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }

  return url;
}