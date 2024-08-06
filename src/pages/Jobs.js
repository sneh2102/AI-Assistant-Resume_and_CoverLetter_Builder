import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Paper, Typography, Link, CircularProgress, Box, Container } from '@mui/material';
import jsPDF from 'jspdf';

const Jobs = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/projects/${id}`);
        setProject(res.data);
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleDownloadCoverLetter = () => {
    const doc = new jsPDF();
    doc.text(project.coverLetter, 10, 10);
    doc.save('coverLetter.pdf');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">No project found</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {project.title}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Status: {project.status}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Type: {project.type}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Posted by: {project.user.name}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <Link href={project.link} target="_blank" rel="noopener noreferrer">
            Job Link
          </Link>
        </Typography>
        <Typography variant="body1" paragraph>
          {project.jobDescription}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          Created At: {new Date(project.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          Last Modified: {new Date(project.updatedAt).toLocaleString()}
        </Typography>
        {project.resumeLink && (
          <Typography variant="subtitle2" gutterBottom>
            <Link href={project.resumeLink} >
              Download Resume
            </Link>
          </Typography>
        )}
        {project.coverLetter && (
          <Typography variant="subtitle2" gutterBottom>
            <Link onClick={handleDownloadCoverLetter} style={{ cursor: 'pointer' }}>
              Download Cover Letter
            </Link>
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Jobs;
