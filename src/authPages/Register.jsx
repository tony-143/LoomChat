import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

const SignupPage = () => {

    const [details, setDetails] = useState({})
    const [emailError,setEmailError] = useState(false)
    const [loading,setLoading] = useState(false)
    const navigate = useNavigate()


    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const formValues = Object.fromEntries(formData.entries());

        const result = await authApi('register','POST',formValues)
        if(result.non_field_errors) {
            setEmailError(true)
        }
        else{
            sessionStorage.setItem('email',formValues.email)
            navigate('/verify')
        }
        setLoading(false)
    };

    return (

        <div className="container-fluid">
            <div style={{ height: '90vh' }} className="row">
                {/* Left Side - Benefits */}
                <div className="col-md-6 d-md-flex flex-column d-none align-items-center justify-content-center bg-light ">
                    <img className="img-responsive img-fluid" width="300" src="https://st1.zoom.us/fe-static/fe-signup-login-active/img/banner-step-2.4b72ef61.png" alt="" />
                    <div style={{ borderRadius: "40px" }} className="p-4 shadow border bg-white">
                        <h2>Create your free Basic account</h2>
                        <ul className="list-unstyled mt-3">
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Unlimited meetings for Free
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Automated captions to help make meetings more inclusive
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Secure, HD-quality audio and video
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>3 editable whiteboards
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Team Chat for collaboration, file sharing, and more
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Loom Mail and Calendar in the Loom app
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Notes for creating and sharing editable documents
                            </li>
                            <li className="mb-3">
                                <i className="fa-solid text-success me-2 fa-circle-check"></i>Screen sharing, virtual backgrounds, breakout rooms, and local recording
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="col-md-6 col-lg-5 col-xl-4 col-xxl-3 d-flex align-items-center justify-content-center">
                    <div className="p-5 pt-0">
                        <h2 className='my-4'>Let's Get Started</h2>
                        <form onSubmit={(e) => handleSignup(e)}>
                            <div className="mb-3 d-felx flex-column gap-3">
                                <input type="text" className="form-control mb-4 border border-secondary" id="name" name='first_name' placeholder="Enter Name" required />

                                <input type="email" className={`form-control border ${emailError?"border-danger":"border-secondary"}`} onChange={()=>setEmailError(false)} id="email" name='email' placeholder="Email Address" required />
                                {emailError && <p className="text-danger">email already in use</p>}
                            </div>
                            <button type="submit" className="btn btn-primary w-100">{loading?"please wait...":"Continue"}</button>
                        </form>
                        <p className="mt-3 w-md-75 w-100">By proceeding, I agree to Zoom’s <a href="#">Privacy Statement</a> and <a href="#">Terms of Service</a>.</p>
                        <div className="text-center mt-4">
                            <p className="my-5 text-secondary">-------- Or sign up with --------</p>
                            <div className="d-flex justify-content-center gap-2">
                                <button className="btn btn-outline-dark">
                                    <i className="fab fa-google"></i> Google
                                </button>
                                <button className="btn btn-outline-dark">
                                    <i className="fab fa-apple"></i> Apple
                                </button>
                                <button className="btn btn-outline-dark">
                                    <i className="fab fa-facebook"></i> Facebook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;
