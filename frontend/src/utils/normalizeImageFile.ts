const MAX_AVATAR_DIMENSION = 1920;

/**
 * Converts any image file to JPEG using a canvas.
 * Handles HEIC/HEIF from iOS cameras and files with missing/wrong MIME type
 * (e.g. application/octet-stream from some Android WebViews).
 *
 * If forceConvert is false (default), skips conversion when the file type is
 * already in acceptedTypes. If true, always re-encodes — use for avatar uploads
 * where large phone photos (4–10 MB) must be compressed below the 2 MB backend limit.
 *
 * Falls back to the original file if canvas conversion fails.
 */
export async function normalizeImageToJpeg(
  file: File,
  acceptedTypes: ReadonlyArray<string> = ["image/jpeg", "image/png"],
  forceConvert = false,
): Promise<File> {
  if (!forceConvert && acceptedTypes.includes(file.type)) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_AVATAR_DIMENSION || h > MAX_AVATAR_DIMENSION) {
        const scale = MAX_AVATAR_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, ".jpg") || "photo.jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
