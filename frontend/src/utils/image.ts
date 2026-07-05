const ALLOWED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const PROFILE_IMAGE_MAX_DIMENSION = 1024;
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TARGET_BYTES = 1024 * 1024;

type OutputType = "image/webp" | "image/jpeg";

export async function optimizeProfileImage(file: File) {
  if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_PROFILE_IMAGE_TYPES)[number])) {
    throw new Error("Elige una imagen JPG, PNG o WEBP.");
  }

  if (typeof document === "undefined") {
    throw new Error("Tu navegador no permite optimizar imágenes aquí.");
  }

  const image = await loadImage(file);
  const { width, height } = getContainedSize(image.naturalWidth, image.naturalHeight, PROFILE_IMAGE_MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la imagen para subir.");
  }

  const outputType = supportsWebp(canvas) ? "image/webp" : "image/jpeg";

  if (outputType === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);

  const qualities = outputType === "image/webp" ? [0.8, 0.72, 0.64, 0.56] : [0.82, 0.74, 0.66, 0.58];
  let bestBlob: Blob | null = null;

  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    bestBlob = blob;

    if (blob.size <= PROFILE_IMAGE_TARGET_BYTES) {
      break;
    }
  }

  if (!bestBlob || bestBlob.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error("La imagen sigue pesando más de 5 MB después de optimizarla.");
  }

  return new File([bestBlob], buildOptimizedFileName(file.name, outputType), {
    type: outputType,
    lastModified: Date.now()
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    image.src = objectUrl;
  });
}

function getContainedSize(sourceWidth: number, sourceHeight: number, maxDimension: number) {
  const largestSide = Math.max(sourceWidth, sourceHeight);

  if (largestSide <= maxDimension) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = maxDimension / largestSide;
  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale)
  };
}

function supportsWebp(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: OutputType, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

function buildOptimizedFileName(fileName: string, outputType: OutputType) {
  const extension = outputType === "image/webp" ? "webp" : "jpg";
  const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "profile-image";
  return `${baseName}.${extension}`;
}
