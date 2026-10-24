"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { imageUrl } from "../lib/api";

export default function AdminImagePicker({ label = "Image", file, currentUrl, onChange }) {
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const source = preview || (currentUrl ? imageUrl(currentUrl) : "");

  return (
    <div className="admin-image-picker">
      <div className="admin-image-preview">
        {source ? (
          <Image src={source} alt={`${label} preview`} fill sizes="180px" unoptimized />
        ) : (
          <span aria-hidden="true">＋</span>
        )}
      </div>
      <label>
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
        <small>JPEG, PNG or WebP · maximum 2 MB</small>
      </label>
    </div>
  );
}

export async function uploadCatalogImage(api, file) {
  if (!file) return "";
  const data = new FormData();
  data.append("file", file);
  const response = await api.post("/admin/uploads/catalog", data);
  return response.data.data.imageUrl;
}
