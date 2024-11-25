import React, { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import {
  initializeGapiClient,
  listFolderImages,
  uploadFile,
  downloadFile, 
} from "./api/drive";
import { Button, Table, TableProps } from "antd";
import { DownloadOutlined, LogoutOutlined } from "@ant-design/icons";

import styles from './app.module.css'


interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;

const App = () => {
  const [images, setImages] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "",
      key: "download",
      render: (_, record: any) => (
            <DownloadOutlined onClick={() => handleDownload(record.id)}/>
      ),
      width:'20px'
    },
    {
      title: "File",
      dataIndex: "name",
      key: "name",
      render: (text, record: any) => (
        <a href={record.thumbnailLink} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Type",
      dataIndex: "mimeType",
      key: "mimeType",
      render: (text) => text,
    },
  
  ];

  const checkAuthStatusInGapi = async () => {
    try {
      await initializeGapiClient();
      const authInstance = gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();
      setIsAuthenticated(isSignedIn);
      if (isSignedIn) {
        fetchImages();
      }
    } catch (error) {
      console.error("Error initializing GAPI:", error);
    }
  };

  useEffect(() => {
    console.log('useeddect')
    checkAuthStatusInGapi();
    setImages([])
  // fetchImages()
  }, []);

  const fetchImages = async () => {
    const files = await listFolderImages(FOLDER_ID);
    setImages(files);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      console.log("Uploading file:", file);

      await uploadFile(FOLDER_ID, file);
      fileInputRef.current!.value = "";
      fetchImages(); 
    }
  };

  const handleLogin = async () => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
      setIsAuthenticated(true);
      fetchImages();
    } catch (error) {
      console.error("Error login:", error);
    }
  };

  const handleLogout = () => {
    gapi.auth2.getAuthInstance().signOut();
    setIsAuthenticated(false);
  };

  const handleDownload = (fileId: string) => {
    downloadFile(fileId);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <Button onClick={handleLogin}>Login with Google</Button>
      ) : (
        <>
        <div className={styles.spaceBetweenDiv}>
          <input
            type="file"
            accept="image/*,application/pdf"
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <LogoutOutlined   onClick={handleLogout}/>
          </div>
          <Table<DataType> columns={columns} dataSource={images} rowKey="id" />
        </>
      )}
    </div>
  );
};

export default App;
