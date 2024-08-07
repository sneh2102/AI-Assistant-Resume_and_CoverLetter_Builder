import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Project from "./pages/Project";
import SignUp from "./pages/Register";
import Information from "./pages/Information";
import Job from "./pages/Jobs";
import { CoverLetter } from "./components/CoverLetter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />}></Route>
        <Route path="/project/:id" element={<Project />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<SignUp />}></Route>
        <Route path="/information" element={<Information/>}></Route>
        <Route path="/job/:id" element={<Job/>}></Route>
        <Route path="/cover-letter/:id" element={<CoverLetter/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
