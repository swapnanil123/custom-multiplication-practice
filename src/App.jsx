import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Templates/Home.jsx";
import PageNotFound from "./Templates/PageNotFound.jsx";
// import Test from './Templates/test.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
