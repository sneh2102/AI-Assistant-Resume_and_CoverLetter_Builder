import React, { useEffect, useState, useRef } from "react";
import { CgSoftwareDownload as SaveIcon } from "react-icons/cg";
import { MdContentCopy as CopyIcon } from "react-icons/md";
import { MdDelete as CleanIcon } from "react-icons/md";
import placeholder from "./Placeholder";
import AceEditor from "react-ace";
import "ace-builds/webpack-resolver";
import useClipboard from "react-use-clipboard";
import "ace-builds/src-noconflict/mode-latex";
import "ace-builds/src-noconflict/snippets/latex";
import "ace-builds/src-noconflict/ext-language_tools";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import AIPromptPopup from "./AIPromptPopUp";
import axios from "axios";
import api from "../api";

function Editor({ content, changeContent, isCompiled, compiled }) {
  const [open, setOpen] = useState(false);
  const editorRef = useRef(null);
  const [isCopied, setCopied] = useClipboard(content);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [aiResponse, setAIResponse] = useState("");
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "i") {
        event.preventDefault();
        const { top, left } = editorRef.current.editor.getCursorPosition();
        const { pageX, pageY } = event;
        setPopupPosition({ top: pageY, left: pageX });
        setShowPopup(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [content]);

  useEffect(() => {
    if (content === "") {
      localStorage.setItem("latex", placeholder);
    } else {
      localStorage.setItem("latex", content);
    }
  }, [content]);

  useEffect(() => {
    let encodedString;
    if (content === "") {
      encodedString = btoa(placeholder);
    } else {
      encodedString = btoa(content);
    }

    const formData = new FormData();
    formData.append("tex", encodedString);

    // axios.post("http://localhost:8080/compile", {
    //   formData,
    // },{
    //   headers: {
    //     'Authorization': 'Bearer ' + Cookies.get('token')
    //   }
    // })
    //   .then((response) => {
    //     return response.json();
    //   })
    //   .then((response) => {
    //     setAnnotations(response);
    //     isCompiled(false);
    //   })
    //   .catch((error) => console.log(error));
  }, [compiled]);

  const handleEditorChange = (value, event) => {
    changeContent(value);
  };

  const handleClearClick = () => {
    changeContent("");
  };

  const handleFetchUser = async () => {
    const response = await api.get("http://localhost:8080/me");
    const data = await response.data;
    console.log("Data:", data);
    return response;
  };

  const handlePromptSubmit = async (prompt) => {
    let accumulatedResponse = "";
    let displayedResponse = "";
    let cursorPosition = editorRef.current.editor.getCursorPosition();
    const session = editorRef.current.editor.getSession();
    let updateTimeout;

    const data = await handleFetchUser();
    try {
      const response = await axios.post(
        process.env.AI_API_KEY,
        {
          model: "llama3",
          prompt: `Keep in mind only give the latex code only nothing else and use this user information data: ${data.data.previousJobs}, Projects: ${data.data.projects}, ${data.data.skills} and this job description: ${data.data.jobDescription} ` + prompt,
          stream: true,
        },
        {
          responseType: "text",
          onDownloadProgress: (progressEvent) => {
            const dataChunk = progressEvent.event.target.responseText;
            accumulatedResponse = handleStreamChunk(dataChunk);

            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
              if (accumulatedResponse !== displayedResponse) {
                const diff = accumulatedResponse.slice(displayedResponse.length);
                session.insert(cursorPosition, diff);
                cursorPosition = editorRef.current.editor.getCursorPosition();
                displayedResponse = accumulatedResponse;
              }
            }, 100);
          },
        }
      );

      if (accumulatedResponse !== displayedResponse) {
        const diff = accumulatedResponse.slice(displayedResponse.length);
        session.insert(cursorPosition, diff);
      }

      setAIResponse(accumulatedResponse);
      setShowPopup(false);
    } catch (error) {
      console.error("Error calling AI API:", error);
    }
  };

  const handleStreamChunk = (dataChunk) => {
    const lines = dataChunk.split("\n");
    let response = "";

    lines.forEach((line) => {
      if (line.trim() !== "") {
        try {
          const parsedData = JSON.parse(line);
          if (parsedData.response) {
            response += parsedData.response;
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    });

    return response;
  };

  const handleDownloadClick = () => {
    let blob = new Blob([content], {
      type: "text/plain",
    });
    let a = document.createElement("a");
    a.download = "latex.tex";
    a.href = window.URL.createObjectURL(blob);
    a.click();
  };

  const handleCopyClick = () => {
    setCopied(content);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="tex-editor scroll">
      <div className="section-title">
        <h3>Editor</h3>
        <div className="right-section">
          <Tooltip title="Download Latex">
            <button onClick={handleDownloadClick} className="btn">
              <SaveIcon />
            </button>
          </Tooltip>
          <Tooltip title="Copy to Clipboard">
            <button onClick={handleCopyClick} className="btn">
              <CopyIcon />
            </button>
          </Tooltip>
          <Tooltip title="Clear">
            <button onClick={handleClearClick} className="btn">
              <CleanIcon />
            </button>
          </Tooltip>
        </div>
      </div>

      <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" elevation={6} variant="filled">
          <AlertTitle>Copied</AlertTitle>
          The latex is copied to your clipboard
        </Alert>
      </Snackbar>
      <AceEditor
        mode="latex"
        value={content}
        theme="dracula"
        className="editable editor"
        onChange={handleEditorChange}
        onValidate={setAnnotations}
        name="editor"
        height="96%"
        width="100%"
        fontSize="15px"
        ref={editorRef}
        annotations={annotations}
        enableBasicAutocompletion={true}
        enableLiveAutocompletion={true}
        enableSnippets={true}
        editorProps={{ $blockScrolling: true }}
      />
      {showPopup && (
        <AIPromptPopup
          position={popupPosition}
          onClose={() => setShowPopup(false)}
          onSubmit={handlePromptSubmit}
        />
      )}
    </div>
  );
}

export default Editor;
