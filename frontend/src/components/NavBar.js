import CreateIcon from "@mui/icons-material/Create";
import HomeIcon from "@mui/icons-material/Home";
import SaveIcon from "@mui/icons-material/Save";
import { Stack, TextField, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Logo from "./Logo";

function NavBar(props) {
  const { id, title, content } = props;
  const [open, setOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("success");
  const [message, setMessage] = React.useState("");
  const URL = process.env.REACT_APP_BASE_URL
  const handleCloseDialog = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };
  const [editing, setEditing] = useState(false);
  const [titleEdit, setTitleEdit] = useState(title);
  const handleEditStart = () => {
    setEditing(true);
  };
  const handleEditEnd = () => {
    setEditing(false);
  };
  const handleChange = (event) => {
    setTitleEdit(event.target.value);
  };
  const updateProjectData = async (title, content) => {
    try {
      const response = await api.put(URL+`/projects/${id}`, {
        title: title,
        resume: content,
      });
      const data = await response.data;
      if (data) {
        setMessage("Update project successfully!");
        setSeverity("success");
        setTimeout(() => {
          navigate(`/`);
        }, 1000);
      }
    } catch (error) {
      setMessage("Error updating project data:", error.message);
      setSeverity("error");
    }
    setOpen(true);
  };
  const navigate = useNavigate();

  return (
    <nav style={{ justifyContent: "start", gap: "20px" }} className="navbar">
      <h3 className="title">
        <Link to="/">
          <Logo />
        </Link>
        &nbsp;OVERLEAF
      </h3>
      <Divider color="#e7e9ee" orientation="vertical" flexItem />
      <Tooltip title="Back to your projects">
        <HomeIcon style={{ cursor: "pointer" }} onClick={() => navigate("/")} />
      </Tooltip>
      <Stack style={{ paddingLeft: "200px" }} direction="row" spacing={2}>
        {editing ? (
          <TextField
            id="textField"
            defaultValue={title}
            variant="filled"
            onChange={handleChange}
            onBlur={handleEditEnd}
            autoFocus
            style={{ backgroundColor: "white" }}
            value={titleEdit}
          />
        ) : (
          <Typography
            onClick={handleEditStart}
            style={{ cursor: "text" }}
            variant="h6"
          >
            {titleEdit}
          </Typography>
        )}
        <CreateIcon onClick={handleEditStart} style={{ cursor: "pointer" }} />
      </Stack>
      <Tooltip title="Save project">
        <SaveIcon
          onClick={() => updateProjectData(titleEdit, content)}
          style={{ marginLeft: "200px", cursor: "pointer" }}
        />
      </Tooltip>
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        open={open}
        autoHideDuration={3000}
        onClose={handleCloseDialog}
      >
        <Alert
          onClose={handleCloseDialog}
          severity={severity}
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </nav>
  );
}

export default NavBar;
