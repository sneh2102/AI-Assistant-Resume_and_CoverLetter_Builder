import { Button, Container, Grid, Stack, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Cookies from "js-cookie";
import moment from "moment/moment";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ResponsiveAppBar from "../components/AppBar";
import { BlankPlaceholder } from "../components/BlankPlaceholder";
import TableProjects from "../components/TableProjects";

const Homepage = () => {
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState("success");
  const [message, setMessage] = useState("");
  const [dataProject, setDataProject] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [newProject, setNewProject] = useState({
    projectName: "",
    link: "",
    jobDescription: "",
    type: "",
    status: "",
  });

  const handleCloseDialog = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleClickOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const getMonthYear = () => {
    const today = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = today.getMonth();
    const month = monthNames[monthIndex];
    const year = today.getFullYear();

    return `${month} ${year}`;
  };

  function buildData(data) {
    return data.map((record) => ({
      id: record.id,
      title: record.title,
      updatedAt: moment(record.updatedAt).format("DD/MM/YYYY HH:mm:ss"),
      link: record.link,
      jobDescription: record.jobDescription,
      type: record.type,
      status: record.status,
      resume: "",
      coverLetter: "",
      resumeLink: "",
      coverLetterLink: "",
    }));
  }

  const fetchUserData = async () => {
    try {
      const response = await api.get("http://localhost:8080/me");
      const data = await response.data;
      setUser(data);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.log(error.message);
      setUser(null);
      setIsAuthenticated(false);
      Cookies.remove("token");
    }
  };

  const fetchProjectData = async () => {
    try {
      const response = await api.get("http://localhost:8080/projects");
      let data = await response.data;
      data = buildData(data);
      setDataProject(data);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchUserData().then(() => fetchProjectData());
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleScrapeDescription = async () => {
    if (newProject.link) {
      try {
        const response = await api.post("http://localhost:8080/scrape", 
          { url: newProject.link },
          { 
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("token")}`
            } 
          }
        );
        const scrapedDescription = response.data.jobDescription;
        setNewProject((prev) => ({ ...prev, jobDescription: scrapedDescription }));
      } catch (error) {
        console.error("Error scraping job description:", error);
        setMessage("Failed to scrape job description");
        setSeverity("error");
        setOpen(true);
      }
    } else {
      setMessage("Please enter a valid URL");
      setSeverity("warning");
      setOpen(true);
    }
  };

  return (
    <>
      <ResponsiveAppBar user={user} isAuthenticated={isAuthenticated} />
      <Container style={{ height: "100vh" }}>
        <Grid container>
          <Stack
            m={5}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            style={{ width: "100%" }}
          >
            <Typography
              variant="h5"
              style={{ flexGrow: 1, textAlign: "center" }}
            >
              All Projects
            </Typography>
            <Button
              onClick={handleClickOpen}
              variant="contained"
              color="primary"
            >
              New Project
            </Button>
          </Stack>
          {dataProject.length > 0 ? (
            <TableProjects dataProject={dataProject} />
          ) : (
            <Typography variant="body1" style={{ textAlign: "center", width: "100%" }}>
              No projects found. Create a new project to get started!
            </Typography>
          )}
        </Grid>
      </Container>
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: async (event) => {
            event.preventDefault();
            if (user) {
              const data = {
                title: newProject.projectName,
                resume: BlankPlaceholder(newProject.projectName, user.name, getMonthYear()),
                userId: user.id,
                link: newProject.link,
                jobDescription: newProject.jobDescription,
                type: newProject.type,
                status: newProject.status,
              };
              try {
                const res = await api.post("http://localhost:8080/projects", data);
                const newProjectId = res.data.id;
                if (newProjectId) {
                  setMessage("Create new project successfully!");
                  setSeverity("success");
                  handleClose();
                  setTimeout(() => {
                    navigate(`/project/${newProjectId}`);
                  }, 1000);
                }
              } catch (error) {
                if (error.response && error.response.data) {
                  console.log(error.response.data.message);
                } else {
                  console.log("An error occurred. Please try again.");
                }
              }
            } else {
              setMessage("Please log in to create project");
              setSeverity("error");
            }
            setOpen(true);
          },
        }}
      >
        <DialogTitle>New Project</DialogTitle>
        <DialogContent style={{ minWidth: "500px" }}>
          <DialogContentText></DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="projectName"
            name="projectName"
            label="Project name"
            type="text"
            fullWidth
            variant="standard"
            value={newProject.projectName}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            id="link"
            name="link"
            label="Job Link"
            type="text"
            fullWidth
            variant="standard"
            value={newProject.link}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            id="jobDescription"
            name="jobDescription"
            label="Job Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={newProject.jobDescription}
            onChange={handleInputChange}
          />
          <Button onClick={handleScrapeDescription}>Scrape the Job Description</Button>
          <TextField
            select
            margin="dense"
            id="type"
            name="type"
            label="Select an option"
            fullWidth
            variant="standard"
            value={newProject.type}
            onChange={handleInputChange}
          >
            <MenuItem value="Full-time">Full-Time</MenuItem>
            <MenuItem value="Part-Time">Part-Time</MenuItem>
            <MenuItem value="Internship">Internship</MenuItem>
          </TextField>
          <TextField
            select
            margin="dense"
            id="status"
            name="status"
            label="Select an option"
            fullWidth
            variant="standard"
            value={newProject.status}
            onChange={handleInputChange}
          >
            <MenuItem value="Applied">Applied</MenuItem>
            <MenuItem value="Interviewed">Interviewed</MenuItem>
            <MenuItem value="Rejection">Rejection</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogActions>
      </Dialog>
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
    </>
  );
};

export default Homepage;