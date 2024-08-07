import React, { useState } from "react";

function AIPromptPopup({ position, onClose, onSubmit }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(prompt);
    setPrompt("");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        backgroundColor: "white",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={4}
          cols={30}
        />
        <div>
          <button type="submit">Generate</button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIPromptPopup;