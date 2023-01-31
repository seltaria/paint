import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Canvas } from "./components/Canvas";
import { SettingBar } from "./components/SettingBar";
import { Toolbar } from "./components/Toolbar";
import "./styles/app.scss";

export function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/:id" element={
            <>
              <Toolbar />
              <SettingBar />
              <Canvas />
            </>
          }>
          </Route>
          <Route path="/" element={<Navigate to={`${(+new Date()).toString(16)}`} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
