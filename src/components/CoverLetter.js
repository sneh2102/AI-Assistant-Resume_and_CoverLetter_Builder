import React, { useEffect, useState, useRef } from "react";
import ReactQuill from 'react-quill';
import html2pdf from 'html2pdf.js';
import { CgSoftwareDownload as SaveIcon } from "react-icons/cg";
import { MdContentCopy as CopyIcon } from "react-icons/md";
import { MdDelete as CleanIcon } from "react-icons/md";
import useClipboard from "react-use-clipboard";
import 'react-quill/dist/quill.snow.css';
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import AIPromptPopup from "./AIPromptPopUp";  // Make sure to import your AIPromptPopup component
import axios from "axios";
import api from "../api";
import { useParams } from "react-router-dom";

export const CoverLetter = () => {
    const { id } = useParams();
  const [content, setContent] = useState('');
  const [margin, setMargin] = useState({ top: 20, right: 20, bottom: 20, left: 20 });
  const editorRef = useRef(null);
  const [isCopied, setCopied] = useClipboard(content);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [job, setJob] = useState(null);

  const handleMarginChange = (e) => {
    const { name, value } = e.target;
    setMargin((prevMargin) => ({ ...prevMargin, [name]: parseInt(value, 10) }));
  };

  const downloadPdf = () => {
    const element = document.createElement('div');
    element.style.padding = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
    element.innerHTML = content;
    html2pdf().from(element).save('cover_letter.pdf');
  };

  useEffect(() => {
    const fetchJobDecription = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/projects/${id}`);
            console.log('Job:', res.data);
            setJob(res.data);
            setContent(res.data.coverLetter);
            
          } catch (error) {
            console.error("Error fetching project data:", error);
          } finally {
            
          }
    }
    fetchJobDecription();
}, [id]);

  useEffect(() => {
    if (editorRef.current) {
      console.log("Editor instance available");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "i") {
        event.preventDefault();
        const { pageX, pageY } = event;
        setPopupPosition({ top: pageY, left: pageX });
        setShowPopup(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handlePromptSubmit = async (prompt) => {
    let accumulatedResponse = '';
    const quillEditor = editorRef.current.getEditor();
    const initialLength = quillEditor.getLength();
  
    try {
      const response = await axios.post(process.env.AI_API_KEY, {
        "model": "llama3",
        "prompt": prompt,
        "stream": true
      }, {
        responseType: 'text',
        onDownloadProgress: progressEvent => {
          const dataChunk = progressEvent.event.target.responseText;
          const newContent = handleStreamChunk(dataChunk);
          
          if (newContent !== accumulatedResponse) {
            const diff = newContent.slice(accumulatedResponse.length);
            quillEditor.insertText(initialLength + accumulatedResponse.length, diff);
            accumulatedResponse = newContent;
          }
        }
      });
  
      setShowPopup(false);
    } catch (error) {
      console.error("Error calling AI API:", error);
    }
  };
  
  const handleStreamChunk = (dataChunk) => {
    const lines = dataChunk.split('\n');
    let response = '';
    
    lines.forEach(line => {
      if (line.trim() !== '') {
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
  const handleCopyClick = () => {
    setCopied(content);
    setOpen(true);
  };

  const handleClearClick = () => {
    setContent("");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFetchUser = async() => {
    const response = await api.get("http://localhost:8080/me");
    const data = await response.data;
    console.log('Data:', data);
    return response;
  }

  const generateCoverLetter = async () => {
    const data = await handleFetchUser();
    console.log('Data:', data);
    setIsGenerating(true);
    const prompt = `Generate a professional cover letter for this job description ${job.jobDescription}. Include standard sections like introduction, qualifications, and closing. Use appropriate formatting.Using this user Qualifications ${data.data.previousJobs} and ${data.data.projects} and ${data.data.skills}`;
    
    let accumulatedResponse = '';
    const quillEditor = editorRef.current.getEditor();
  
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        "model": "llama3",
        "prompt": prompt,
        "stream": true
      }, {
        responseType: 'text',
        onDownloadProgress: progressEvent => {
          const dataChunk = progressEvent.event.target.responseText;
          const newContent = handleStreamChunk(dataChunk);
          
          if (newContent !== accumulatedResponse) {
            const diff = newContent.slice(accumulatedResponse.length);
            quillEditor.insertText(quillEditor.getLength() - 1, diff);
            accumulatedResponse = newContent;
          }
        }
      });
  
      // Instead of setting the content directly, we'll use the Quill API to format the text
      const lines = accumulatedResponse.split('\n');
      quillEditor.setText(''); // Clear existing content
      
      lines.forEach((line, index) => {
        if (line.trim() === '') return; // Skip empty lines
        
        if (index === 0) {
          // Assume the first line is a header
          quillEditor.insertText(quillEditor.getLength(), line, 'header', 2);
        } else if (line.endsWith(':')) {
          // Assume lines ending with ':' are subheaders
          quillEditor.insertText(quillEditor.getLength(), line, 'header', 3);
        } else {
          // Regular paragraph
          quillEditor.insertText(quillEditor.getLength(), line);
        }
        quillEditor.insertText(quillEditor.getLength(), '\n');
      });
  
      // Update the content state with the formatted content
      setContent(quillEditor.root.innerHTML);
    } catch (error) {
      console.error("Error generating cover letter:", error);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleSave = async () => {
    try {
      const response = await api.put(`http://localhost:8080/projects/cover/${id}`, {
        coverLetter: content
      });
      console.log('Response:', response);
    } catch (error) {
      console.error("Error saving cover letter:", error);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Cover Letter</h1>
        <div>

            <Tooltip title="Generate Cover Letter">
            <button onClick={generateCoverLetter} className="btn">
                <span role="img" aria-label="Generate">🤖</span>
            </button>
            </Tooltip>
            <Tooltip title="Save Cover Letter">
            <button onClick={handleSave} className="btn">
                <span role="img" aria-label="Save">💾</span>
            </button>
            </Tooltip>
          <Tooltip title="Download PDF">
            <button onClick={downloadPdf} className="btn">
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
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Top Margin:
          <input
            type="number"
            name="top"
            value={margin.top}
            onChange={handleMarginChange}
            style={{ marginLeft: '5px', width: '60px' }}
          />
        </label>
        <label style={{ marginRight: '10px' }}>
          Right Margin:
          <input
            type="number"
            name="right"
            value={margin.right}
            onChange={handleMarginChange}
            style={{ marginLeft: '5px', width: '60px' }}
          />
        </label>
        <label style={{ marginRight: '10px' }}>
          Bottom Margin:
          <input
            type="number"
            name="bottom"
            value={margin.bottom}
            onChange={handleMarginChange}
            style={{ marginLeft: '5px', width: '60px' }}
          />
        </label>
        <label style={{ marginRight: '10px' }}>
          Left Margin:
          <input
            type="number"
            name="left"
            value={margin.left}
            onChange={handleMarginChange}
            style={{ marginLeft: '5px', width: '60px' }}
          />
        </label>
      </div>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
          height: 'calc(500px + 40px)', // Adjust height to account for padding
          boxSizing: 'border-box',
        }}
      >
       <ReactQuill
  ref={editorRef}
  value={content}
  onChange={setContent}
  theme="snow"
  modules={{
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
  }}
/>
      </div>
      <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity="success"
          elevation={6}
          variant="filled"
        >
          <AlertTitle>Copied</AlertTitle>
          The content is copied to your clipboard
        </Alert>
      </Snackbar>
      {showPopup && (
        <AIPromptPopup
          position={popupPosition}
          onClose={() => setShowPopup(false)}
          onSubmit={handlePromptSubmit}
        />
      )}
    </div>
  );
};

export default CoverLetter;
