import React, { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { CgSoftwareDownload as SaveIcon } from "react-icons/cg";
import { MdLoop as CompileIcon } from "react-icons/md";
import { RiFullscreenFill as FullScreenIcon } from "react-icons/ri";
import Tooltip from "@mui/material/Tooltip";
import { Document, Page, pdfjs } from "react-pdf";
import {TailSpin} from "react-loader-spinner";
import styled from "styled-components";
import axios from "axios";
import { Buffer } from 'buffer';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function Preview({ content, isCompiled, id }) {
  const [rawFile, setRawFile] = useState("");
  const [rawResponse, setRawResponse] = useState({});
  const handle = useFullScreenHandle();
  const [isLoading, setIsLoading] = useState(false);
  const URL = process.env.REACT_APP_BASE_URL
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    handleCompile();

  }, []);
  const postData = async() => {
    try {
      const content = localStorage.getItem("latex");
      const encodedString = Buffer.from(content).toString("base64");
      console.log(encodedString);
      const formData = new FormData();
      const response = await axios.get(URL+`/projects/${id}`);
      formData.append("tex", encodedString);
      formData.append("filename", response.data.title);
      formData.append("id", id);
  
      const postResponse = await axios.post(URL+"/upload", formData, {
        responseType: 'blob' // Ensure the response is treated as a blob
      });
  
      if (postResponse.status === 200) {
        const blob = postResponse.data;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          setRawResponse("");
          setRawFile(base64data);
        };
        reader.readAsDataURL(blob);
      } else {
        const errorResponse = await postResponse.json();
        setRawResponse(errorResponse.error);
      }
    } catch (error) {
      console.error("An error occurred during data fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleFullScreen = () =>
    handle.active ? handle.exit() : handle.enter();

  const handleSaveClick = () => {
    let link = document.createElement("a");
    link.href = rawFile;
    link.download = "download.pdf";
    link.click();
  };
  const handleCompile = () => {
    setIsLoading(true);
    isCompiled(true);
    postData();
  };
  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
  }

  return (
    <div className="pdfview scroll">
      <div className="section-title">
        <h3>Preview</h3>
        <div className="right-section">
          <Tooltip title="Compile">
            <button className="btn" onClick={handleCompile}>
              <CompileIcon />
            </button>
          </Tooltip>
          <Tooltip title="Download PDF">
            <button className="btn" onClick={handleSaveClick}>
              <SaveIcon />
            </button>
          </Tooltip>
          <Tooltip title="FullScreen">
            <button className="btn" onClick={handleFullScreen}>
              <FullScreenIcon />
            </button>
          </Tooltip>
        </div>
      </div>
      <FullScreen handle={handle}>
        <div
          id="preview"
          className={`html-div ${handle.active ? "preview-fullscreen" : ""}`}
        >
          {(() => {
            if (isLoading) {
              return (
                <Fallbackcontainer>
                  <TailSpin height={600} color="#282a36" />
                </Fallbackcontainer>
              );
            }

            if (Object.keys(rawResponse).length !== 0) {
              return <div>{rawResponse}</div>;
            }
            if (Object.keys(rawFile).length !== 0) {
              return (
                <DefaultContainer>
                  <Document
                    file={rawFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                  >
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page
                        renderTextLayer={false}
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={1.5}
                      />
                    ))}
                  </Document>
                </DefaultContainer>
              );
            }
          })()}
        </div>
      </FullScreen>
    </div>
  );
}

export default Preview;

const Fallbackcontainer = styled.div`
  transform: translateX(50%);
`;
const DefaultContainer = styled.div`
  color: transparent;
`;
