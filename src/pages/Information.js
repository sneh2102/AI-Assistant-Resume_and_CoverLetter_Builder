import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import  {useNavigate} from "react-router-dom";
import axios from 'axios';
import Cookies from 'js-cookie';
import api from '../api';

function ResumeBuilder() {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [duration, setDuration] = useState('');
  const [summary, setSummary] = useState('');
  const [previousJobs, setPreviousJobs] = useState('');
  
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState('');
  
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [projects, setProjects] = useState('');


  const handleAddJob = () => {
    const newJob = `${jobTitle} at ${company} (${duration}) - ${summary}`;
    setPreviousJobs(prev => prev ? `${prev}\n\n${newJob}` : newJob);
    setJobTitle('');
    setCompany('');
    setDuration('');
    setSummary('');
  };

  const handleAddSkill = () => {
    if (skill) {
      setSkills(prev => prev ? `${prev}, ${skill}` : skill);
      setSkill('');
    }
  };

  const handleAddProject = () => {
    const newProject = `${projectName}\nDescription: ${projectDescription}\nTech Stack: ${projectTechStack}`;
    setProjects(prev => prev ? `${prev}\n\n${newProject}` : newProject);
    setProjectName('');
    setProjectDescription('');
    setProjectTechStack('');
  };

  const handleFetchUser = async() => {
    const response = await api.get("http://localhost:8080/me");
    const data = await response.data;
    console.log('Data:', data);
    return response;
  }

  const handleSubmit = async() => {
    const data = await handleFetchUser();
    const user = data.data.id
    console.log('User:', user);
    await axios.put('http://localhost:8080/update', { userId: user, previousJobs, projects, skills }, {
      headers: {
        'Authorization': 'Bearer ' + Cookies.get('token')
      }
    });
    navigate('/')
  }

  return (
    <>
    <Box style={{ padding: '20px' , display: "flex"}}>
    <Box style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Basic Information</Typography>
      <Typography variant="h5" gutterBottom>Work Experience</Typography>
      <TextField fullWidth label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} margin="normal" />
      <TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} margin="normal" />
      <TextField fullWidth label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} margin="normal" />
      <TextField fullWidth label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} margin="normal" multiline rows={3} />
      <Button variant="contained" color="primary" onClick={handleAddJob} style={{ marginTop: '10px' }}>Add Job</Button>
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Skills</Typography>
      <TextField fullWidth label="Skill" value={skill} onChange={(e) => setSkill(e.target.value)} margin="normal" />
      <Button variant="contained" color="primary" onClick={handleAddSkill} style={{ marginTop: '10px' }}>Add Skill</Button>
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Projects</Typography>
      <TextField fullWidth label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} margin="normal" />
      <TextField fullWidth label="Description" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} margin="normal" multiline rows={3} />
      <TextField fullWidth label="Tech Stack" value={projectTechStack} onChange={(e) => setProjectTechStack(e.target.value)} margin="normal" />
      <Button variant="contained" color="primary" onClick={handleAddProject} style={{ marginTop: '10px' }}>Add Project</Button>
    </Box>
      <Box style={{ height: '20px' }} >
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Resume Preview</Typography>
      <Typography variant="h6">Previous Jobs:</Typography>
      <pre>{previousJobs}</pre>
      <Typography variant="h6">Skills:</Typography>
      <p>{skills}</p>
      <Typography variant="h6">Projects:</Typography>
      <pre>{projects}</pre>
      </Box>
    </Box>
      <Button variant="contained" color="primary" style={{ marginTop: '20px' }} onClick={handleSubmit}>Submit</Button>
    </>
  );
}

export default ResumeBuilder;