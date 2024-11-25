import { gapi } from "gapi-script";

const API_KEY = import.meta.env.VITE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const SCOPES = import.meta.env.VITE_SCOPES;

export const initializeGapiClient = async () => {
  try {
    await new Promise<void>((resolve, reject) => {
      gapi.load('client:auth2', {
        callback: resolve,
        onerror: reject
      });
    });

    await gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: SCOPES,
    });

    console.log('GAPI initialized successfully.');
  } catch (error) {
    console.error("Error initializing GAPI:", error);
  }
};

export const listFolderImages = async (folderId: string) => {
  try {
    await gapi.client.load('drive', 'v3');  

    const response = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType='application/pdf') and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, thumbnailLink)", 
    });
    

    if (response && response.result && Array.isArray(response.result.files)) {
      console.log("Fetching images", response);
      return response.result.files;
    } else {
      console.error("No items found or invalid response structure", response);
      return [];
    }
  } catch (error) {
    console.error("Error listing folder images:", error);
    return [];
  }
};

export const uploadFile = async (folderId: string, file: File) => {
  try {
    const fileName = file.name;

    const metadata = {
      name: fileName,
      parents: [folderId],  
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
        },
        body: form,
      }
    );

    const result = await response.json();
    if (response.ok) {
      console.log("File uploaded successfully", result);
      return result;
    } else {
      console.error("Upload failed:", result);
      throw new Error("Error during file upload");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

export const downloadFile = async (fileId: string) => {
  try {
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch file metadata');
    }

    const metadata = await metadataResponse.json();
    const fileName = metadata.name;

    console.log('Metadata:', metadata);

    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
        },
      }
    );

    if (!fileResponse.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await fileResponse.blob();

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    console.log('File downloaded successfully');
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};
