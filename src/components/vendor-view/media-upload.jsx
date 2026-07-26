/**
 * MediaUpload
 * Allows vendors to upload:
 *   - Up to 4 product images
 *   - 1 optional product video
 *
 * All files are sent in a single POST to /api/vendor/products/upload-media
 * The server returns { images: string[], video: string | null }
 */

import { useRef, useState } from "react";
import axios from "@/lib/axios";
import { ImagePlus, Video, X, Loader2, Play, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

const MAX_IMAGES   = 4;
const MAX_FILE_MB  = 100;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024; // bytes

function MediaUpload({ images = [], video = "", onImagesChange, onVideoChange }) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");

  // ── Upload files to backend ──────────────────────────────────────────────
  async function uploadFiles(files) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await axios.post(
        "/api/vendor/products/upload-media",
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        return { images: res.data.images || [], video: res.data.video || null };
      }
      throw new Error(res.data.message || "Upload failed");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  // ── Handle image file selection ───────────────────────────────────────────
  async function handleImageSelect(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Client-side size check — stop before sending to Cloudinary
    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(
        `File${oversized.length > 1 ? "s" : ""} too large: "${oversized.map((f) => f.name).join('", "')}". Images must be less than ${MAX_FILE_MB} MB.`
      );
      e.target.value = "";
      return;
    }

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      e.target.value = "";
      return;
    }

    const toUpload = selected.slice(0, remaining);
    const result   = await uploadFiles(toUpload);
    if (result) {
      onImagesChange([...images, ...result.images]);
    }
    e.target.value = "";
  }

  // ── Handle video file selection ───────────────────────────────────────────
  async function handleVideoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check — stop before sending to Cloudinary
    if (file.size > MAX_FILE_SIZE) {
      setError(`Video "${file.name}" is too large. Videos must be less than ${MAX_FILE_MB} MB.`);
      e.target.value = "";
      return;
    }

    const result = await uploadFiles([file]);
    if (result && result.video) {
      onVideoChange(result.video);
    } else if (result && result.images?.length) {
      setError("Please select a valid video file.");
    }
    e.target.value = "";
  }

  function removeImage(idx) {
    onImagesChange(images.filter((_, i) => i !== idx));
  }

  function removeVideo() {
    onVideoChange("");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Images section ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">
            Product Images
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              ({images.length}/{MAX_IMAGES})
            </span>
          </label>
          {images.length < MAX_IMAGES && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => imageInputRef.current?.click()}
              className="gap-1.5 text-xs h-8"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Add Image
            </Button>
          )}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        {images.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div
                key={url + i}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
                <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                {/* Primary badge */}
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex items-center justify-center text-muted-foreground/40 hover:text-primary/50 transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
            ))}
          </div>
        ) : (
          /* Drop zone when no images yet */
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary/60 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm">
              {uploading ? "Uploading…" : "Click to upload images (max 4)"}
            </span>
          </button>
        )}
      </div>

      {/* ── Video section ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">
            Product Video
            <span className="ml-1 text-xs text-muted-foreground font-normal">(optional, max 1)</span>
          </label>
          {!video && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => videoInputRef.current?.click()}
              className="gap-1.5 text-xs h-8"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
              Add Video
            </Button>
          )}
        </div>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoSelect}
        />

        {video ? (
          <div className="relative rounded-lg overflow-hidden border bg-black group">
            <video
              src={video}
              controls
              className="w-full max-h-48 object-contain"
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed rounded-lg p-5 flex items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary/60 transition-colors"
          >
            <Play className="h-5 w-5" />
            <span className="text-sm">
              {uploading ? "Uploading…" : "Click to upload a product video"}
            </span>
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading to cloud…
        </div>
      )}
    </div>
  );
}

export default MediaUpload;
