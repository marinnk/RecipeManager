"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/recipes";
import { uploadImage } from "@/lib/api/images";
import type { UploadedImage } from "@/types/image";

type UseUploadImageResult = {
  submit: (file: File) => Promise<UploadedImage | undefined>;
  isUploading: boolean;
  error: string | null;
};

export function useUploadImage(): UseUploadImageResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      return await uploadImage(file);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.body.message
          : "画像のアップロードに失敗しました。時間をおいて再度お試しください。",
      );
      return undefined;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { submit, isUploading, error };
}
