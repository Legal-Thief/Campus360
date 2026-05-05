import axios from "axios";

export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  const data = new FormData();

  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as unknown as Blob);

  data.append("upload_preset", "lostfound_preset");
  data.append("cloud_name", "diafkaqxp");

  const res = await axios.post(
    "https://api.cloudinary.com/v1_1/diafkaqxp/image/upload",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data.secure_url;
};