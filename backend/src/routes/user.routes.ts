import crypto from "node:crypto";
import { Router, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const userRouter = Router();

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const uploadProfileImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROFILE_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "profileImage"));
      return;
    }

    callback(null, true);
  }
}).single("profileImage");

const userSelect = {
  id: true,
  name: true,
  email: true,
  profileImageUrl: true,
  birthDate: true,
  createdAt: true,
  updatedAt: true
};

const civilDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidCivilDate);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  birthDate: z.union([civilDateSchema, z.literal(""), z.null()]).optional()
});

userRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: userSelect
  });

  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  return res.json({ user });
});

userRouter.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos", issues: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.birthDate !== undefined
        ? { birthDate: parsed.data.birthDate ? civilDateToNoonUtc(parsed.data.birthDate) : null }
        : {})
    },
    select: userSelect
  });

  return res.json({ user });
});

userRouter.post("/me/profile-image", requireAuth, (req: AuthRequest, res) => {
  uploadProfileImage(req, res, async (uploadError) => {
    if (uploadError) {
      return handleProfileImageUploadError(uploadError, res);
    }

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Selecciona una imagen para subir" });

    if (!allowedImageTypes.has(file.mimetype) || !hasValidImageSignature(file.buffer, file.mimetype)) {
      return res.status(400).json({ message: "El archivo debe ser una imagen JPG, PNG o WEBP válida" });
    }

    const extension = getImageExtension(file.mimetype);
    const objectPath = `${req.user!.id}/${crypto.randomUUID()}.${extension}`;

    const { error: storageError } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(objectPath, file.buffer, {
      cacheControl: "3600",
      contentType: file.mimetype,
      upsert: false
    });

    if (storageError) {
      return res.status(502).json({ message: "No se pudo subir la foto de perfil" });
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(objectPath);

    try {
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { profileImageUrl: publicUrl },
        select: userSelect
      });

      return res.json({ user, profileImageUrl: publicUrl });
    } catch (error) {
      await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([objectPath]);
      return res.status(500).json({ message: "No se pudo guardar la foto en el perfil" });
    }
  });
});

function civilDateToNoonUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function isValidCivilDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getImageExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }

  return false;
}

function handleProfileImageUploadError(error: unknown, res: Response) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "La imagen no puede pesar más de 5 MB" });
    }

    return res.status(400).json({ message: "Solo se aceptan imágenes JPG, PNG o WEBP" });
  }

  return res.status(400).json({ message: "No se pudo procesar la imagen" });
}
