import type { ApiErrorBody } from "@/types/recipe";
import type { UploadedImage } from "@/types/image";
import { ApiError } from "./recipes";

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  // Content-Typeは指定しない。FormDataを渡すとブラウザがboundary付きの
  // multipart/form-dataヘッダーを自動で設定してくれる。手で指定するとboundaryが
  // 欠落してリクエストが壊れる。
  const res = await fetch("/api/images", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new ApiError(res.status, body);
  }

  return res.json();
}
