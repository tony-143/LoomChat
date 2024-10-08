import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { BrowserRouter as Router ,Routes,Route, useLocation, Navigate } from 'react-router-dom';
import Register from './authPages/Register';
import Navbar from './components/Navbar';
import VerificationPage from './authPages/VerifyPage';
import Password from './authPages/SetPassword';
import LoginPage from './authPages/Login';
import Home from './Pages/Home';
import { JoinPage } from './components/JoinPage';
import { CreateMeeting } from './components/CreateMeeting';
import MeetingPage from './components/MeetingPage';

function App() {
  const location = useLocation();

  return (
    <>
      <Navbar key={location.pathname} />
        <Routes>

          <Route path="/register" element={<Register/>} />
          <Route path="/verify" element={<VerificationPage/>} />
          <Route path="/password" element={<Password/>} />
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/" element={<Home/>} />
          {/* <Route path="/create/meeting" element={<CreateMeeting/>} /> */}
          <Route path="/join/:meetingcode/:name" element={<JoinPage/>} />
          <Route path="/meeting/:meetingcode/:name" element={<MeetingPage/>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </>
  )
}

function AppComponent(){

  return (
    <Router>

      <App/>

    </Router>
  )
}

export default AppComponent
