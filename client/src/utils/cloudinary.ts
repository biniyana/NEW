export async function uploadImageToCloudinary(file: File) {
  const CLOUD_NAME = "detb5sdvp";
  const UPLOAD_PRESET = "waiz_upload";

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(url, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url as string;
}