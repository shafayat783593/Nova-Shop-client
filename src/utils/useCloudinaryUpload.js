import api from "@/app/lib/api";
import { useCallback, useRef, useState } from "react";
/* =====================================================
   CONSTANTS (FIXED)
===================================================== */

const MAX_FILE_SIZE_MB = 4;


const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/pdf",
];

/* =====================================================
   UTILITIES
===================================================== */

const createError = (message, code) => ({ message, code });

const validateFile = (file) => {
    if (!file) {
        throw createError("No file selected", "NO_FILE");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw createError("Unsupported file type", "INVALID_FILE_TYPE");
    }

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        throw createError(
            `Image size must be under ${MAX_FILE_SIZE_MB}MB`,
            "FILE_TOO_LARGE"
        );
    }
};

/* =====================================================
   HOOK
===================================================== */

const useCloudinaryUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const xhrRef = useRef(null);

    /* ============================
       SINGLE FILE UPLOAD
    ============================ */

    const uploadSingle = useCallback(async (file, options = {}) => {
        const { folder = "profiles", onProgress } = options;

        setUploading(true);
        setError(null);

        try {
            // 1️⃣ Validate file (MAX 4MB)
            validateFile(file);

            // 2️⃣ Get Cloudinary signature
            const signRes = await api.get("/api/cloudinary-sign", {
                params: { folder },
            });
            const { signature, timestamp, apiKey, cloudName } = signRes.data;

            // 3️⃣ Prepare FormData
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);
            formData.append("folder", folder);

            // 4️⃣ Upload with progress
            const uploadPromise = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.upload.onprogress = (e) => {
                    if (!e.lengthComputable) return;

                    const percent = Math.round(
                        (e.loaded / e.total) * 100
                    );

                    onProgress?.(percent);
                };

                xhr.onload = () => {
                    const response = JSON.parse(xhr.responseText || "{}");

                    if (xhr.status >= 400 || !response.secure_url) {
                        reject(
                            createError(
                                response?.error?.message || "Upload failed",
                                "UPLOAD_FAILED"
                            )
                        );
                        return;
                    }

                    resolve({
                        url: response.secure_url,
                        publicId: response.public_id,
                    });
                };

                xhr.onerror = () =>
                    reject(createError("Network error", "NETWORK_ERROR"));

                xhr.open(
                    "POST",
                    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
                );
                xhr.send(formData);
            });

            return await uploadPromise;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setUploading(false);
        }
    }, []);

    /* ============================
       CANCEL UPLOAD
    ============================ */

    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
            setUploading(false);
        }
    };

    return {
        uploadSingle,
        cancelUpload,
        uploading,
        error,
    };
};

export default useCloudinaryUpload;
