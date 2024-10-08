import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import password from '../assets/password.avif'
import { authApi } from '../api/api';

const Password = () => {

    const [details, setDetails] = useState({})
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false);
    const [loadings, setLoadings] = useState(false)

    const togglePassword = () => setShowPassword(!showPassword);


    const handleSignup = async (e) => {
        e.preventDefault();
        setLoadings(true);

        const formData = new FormData(e.target);
        const formValues = Object.fromEntries(formData.entries());
    
        if (!formValues.password.trim()) {
            alert('Please enter your password');
        } else if (formValues.password.trim().length < 8) {
            alert('Password must be at least 8 characters');
        } else {
            // Access confirm-password using bracket notation
            if (formValues['confirm-password'].trim() !== formValues.password.trim()) {
                alert('Passwords do not match');
            } else {
                if(sessionStorage.getItem('email')){
                    const data={email:sessionStorage.getItem('email'),password:formValues.password}
                    const result = await authApi('setpassword','POST',data)
                    navigate('/login')
                }
                else {
                    alert('please login');
                }
            }
        }
        // sessionStorage.setItem("email", formValues.email);
       
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
                <div className="col-md-6 col-xl-4 d-flex align-items-center justify-content-center">
                    <div className="p-5 pt-0">
                        <h2 className='my-4'>Set Password</h2>
                        <form onSubmit={(e) => handleSignup(e)}>
                            <div className="mb-3 d-flex flex-column gap-3">
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control border border-secondary"
                                        id="password"
                                        name="password"
                                        placeholder="Enter Password"
                                        required
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={togglePassword}
                                    >
                                        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                    </button>
                                </div>

                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control border border-secondary"
                                        id="confirm-password"
                                        name="confirm-password"
                                        placeholder="Confirm Password"
                                        required
                                    />
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={togglePassword}
                                    >
                                        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Continue</button>
                        </form>
                        <p className="mt-3 w-md-75 w-100">By proceeding, I agree to Loom’s <a href="#">Privacy Statement</a> and <a href="#">Terms of Service</a>.</p>
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

export default Password;
