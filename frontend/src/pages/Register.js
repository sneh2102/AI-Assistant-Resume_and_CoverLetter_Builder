import * as React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const defaultTheme = createTheme();

export default function SignUp() {
  const navigate = useNavigate();
  const [agree, setAgree] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("success");
  const [message, setMessage] = React.useState("");

  const handleCheckboxChange = (event) => {
    setAgree(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const userData = {
      name: `${data.get("firstName")} ${data.get("lastName")}`,
      email: data.get("email"),
      password: data.get("password"),
    };
    try {
      await axios.post("http://localhost:8080/register", userData);
      setMessage("Register new user successfully!");
      setSeverity("success");
      setTimeout(() => {
        navigate("/information",{state: {email: userData.email, password: userData.password}});
      }, 2000);
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage("An error occurred. Please try again.");
      }
      setSeverity("error");
    }
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Link href="/">
            <img
              width="130px"
              src="https://cdn.overleaf.com/img/ol-brand/overleaf-green.svg"
              alt="overleaf"
            />
          </Link>
          <Typography mt={5} component="h1" variant="h5">
            Register for Overleaf
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={handleCheckboxChange}
                      value="allowExtraEmails"
                      color="primary"
                    />
                  }
                  label="I Agree to the Terms and Conditions"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!agree}
            >
              Sign Up
            </Button>
            <Typography variant="body2" color="text.secondary" align="center">
              <Link underline="hover" href="/login" variant="body2">
                {"Already have an account? Sign in"}
              </Link>
            </Typography>
          </Box>
        </Box>
        <Snackbar
          anchorOrigin={{ horizontal: "center", vertical: "top" }}
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert
            onClose={handleClose}
            severity={severity}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}
