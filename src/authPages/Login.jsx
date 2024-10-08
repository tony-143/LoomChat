import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import password from '../assets/Zoom-app-banner.jpg'
import { authApi } from '../api/api';

const LoginPage = () => {

    const [details, setDetails] = useState({})
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false);
    const [loadings, setLoadings] = useState(false);
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [forgotPassword, setForgotPassword] = useState(false)

    const togglePassword = () => setShowPassword(!showPassword);


    const handleSignup = async (e) => {
        e.preventDefault();
        setLoadings(true);
        const formData = new FormData(e.target);
        const formValues = Object.fromEntries(formData.entries());
        if (forgotPassword) {
            sessionStorage.setItem('email', formValues.email)
            const result = await authApi('otp', 'POST', formValues)
            if (result['error']) setEmailError("invalid email please register")
            else navigate("/verify")
        }
        else {
            const result = await authApi('login', 'POST', formValues)
            if (result['email error']) setEmailError("invalid email");
            else if (result['password error']) setPasswordError("invalid password");
            else {
                localStorage.setItem("refresh", result.refresh);
                localStorage.setItem("access", result.access);
                navigate('/home');
            }
        }

        setLoadings(false)
    };

    return (

        <div className="container-fluid">
            <div style={{ height: '90vh' }} className="row">
                {/* Left Side - Benefits */}
                <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
                    <img src={password} alt="Verification Illustration" className="img-fluid" />

                </div>

                {/* Right Side - Form */}
                <div className="col-md-6 col-xxl-3 col-xl-4 col-lg-5 d-flex align-items-center justify-content-center">
                    <div className="p-5 pt-0">
                        <h2 className='my-4 text-center'>Sign In</h2>
                        <form onSubmit={(e) => handleSignup(e)}>
                            <div className="mb-3 d-flex flex-column">
                                <div className="input-group">
                                    <input
                                        type='email'
                                        className={`form-control border ${emailError ? "border-danger" : "border-secondary"}`}
                                        id="email"
                                        name="email"
                                        onChange={() => { setEmailError("") }}
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                                <p className="text-danger mb-0">{emailError}</p>
                                {!forgotPassword && <>
                                    <div className="input-group mt-3 position-relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={`form-control border ${passwordError ? "border-danger" : "border-secondary"}`}
                                            id="password"
                                            name="password"
                                            onChange={() => { setPasswordError("") }}
                                            placeholder="Enter Password"
                                            required
                                        />

                                        <div
                                            style={{ zIndex: '999', cursor: 'pointer' }}
                                            className="top-5 mt-1 me-2 text-secondary position-absolute end-0"

                                            onClick={togglePassword}
                                        >
                                            <i onClick={togglePassword} className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                        </div>
                                    </div>
                                    <p className="text-danger mb-0">{passwordError}</p>
                                </>}
                                {forgotPassword ? <>
                                    <span><a onClick={() => { setForgotPassword(false) }} className="text-primary">Back to login?</a></span>
                                
                                </> :
                                    <span><a onClick={() => { setForgotPassword(true) }} className="text-primary">Forgot Password?</a></span>

                                }

                            </div>
                            <button type="submit" className="btn btn-primary w-100">{loadings ? "please wait.." : <>{forgotPassword ? "Send Otp" : "Continue"}</>}</button>
                        </form>
                        <p className="mt-3 w-md-75 w-100">By proceeding, I agree to Loom’s <a href="#">Privacy Statement</a> and <a href="#">Terms of Service</a>.</p>
                        <div className="text-center mt-4">
                            <p className="my-5 text-secondary">-------- Or sign In with --------</p>
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
                        <div className="my-3">
                            <p>Loom is protected by reCAPTCHA and the Privacy Policy and Terms of Service apply.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
