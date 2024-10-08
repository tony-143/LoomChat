import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api/api';

const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const [login, setLogin] = useState(false)
    const [homeNav, setHomeNav] = useState(false)
    const [userDetails, setUserDetails] = useState({})
    const [showNav, setShowNav] = useState(false)


    React.useEffect(() => {

        const loom = async () => {
            // Handle login and joined paths
            if (location.pathname === '/login' || location.pathname === '/joined') { 
                setLogin(true);  
            } else { 
                setLogin(false); 
            }
    
            // Handle home path
            if (location.pathname === '/') {
                if (localStorage.getItem('access')) {
                    const result = await fetchApi('getuserdetails', 'GET');
                    if (result.details) {
                        setUserDetails(result.details);
                    } else { 
                        console.log(result); 
                    }
                    setHomeNav(true);
                }
            }
    
            // Handle meeting path dynamically
            const meetingRegex = /^\/meeting\/[a-zA-Z0-9]+\/[a-zA-Z]+$/;
            if (meetingRegex.test(location.pathname)) {
                setShowNav(true);  // Hide the navbar if on a meeting page
            } else {
                setShowNav(false);  // Show navbar for other pages
            }
        }
    
        loom();
    }, [location]);
    
    if (showNav) {
        return null;  // Do not render anything when showNav is true
    }
    

    return (
        <nav className="navbar mx-md-5 navbar-light bg-white border-bottom">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Zoom_Communications_Logo.svg/2560px-Zoom_Communications_Logo.svg.png" alt="Zoom Logo" height="30" />
                </a>
                {
                    homeNav ?
                        <div className="ms-auto">
                            {
                                localStorage.getItem('access') ?
                                    <div className="d-flex justify-content-center align-items-center">
                                        <p>Hi' {userDetails.name}</p>
                                    </div> :
                                    <div className="d-flex align-items-center">
                                        <div className="d-flex">
                                            {/* <div className="d-none d-md-block">Already have an account?</div> */}
                                            <button onClick={() => navigate('/login')} className=" rounded btn btn-primary me-3"> Sign In</button>

                                        </div>
                                    </div>
                            }
                        </div> :
                        <div className="d-flex align-items-center">
                            {!login &&
                                <div className="d-flex">
                                    <div className="d-none d-md-block">Already have an account?</div>
                                    <a onClick={() => navigate('/login')} className="text-primary me-3"> Sign In</a>

                                </div>
                            }
                            {login &&
                                <div className="d-flex">
                                    <div className="d-none d-md-block">New Loom account?</div>
                                    <a onClick={() => navigate('/register')} className="text-primary me-3"> Sign Up</a>

                                </div>
                            }

                            <a href="#" className="text-primary d-none d-md-block me-3">Support</a>
                            <a href="#" className="text-primary me-3">English</a>
                        </div>
                }
            </div>
        </nav>
    );
}

export default Navbar;
