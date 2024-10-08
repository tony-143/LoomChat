import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import verifyimg from './../assets/verifyimg.jpg'
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

const VerificationPage = () => {
    const [timer, setTimer] = useState(120); // Set the initial timer (450 seconds)
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [otpError, setOtpError] = useState(false)
    const inputRefs = useRef([]);
    const [loading,setLoading] = useState(false);
    const [timeUp,setTimeUp] = useState(false);
    const navigation = useNavigate()

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleBackspace = (e, index) => {
        if (e.key === 'Backspace' && index > 0 && !otp[index]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleEnter = async () => {
        if(otp[5] && sessionStorage.getItem('email')){
        setLoading(true);
        const otp1=(otp.join(''))
        const data={email:sessionStorage.getItem('email'),otp:otp1}
        const result = await authApi('verify-otp','POST',data);
        
        if(result.non_field_errors) setOtpError(true);
        else navigation('/password')

        setLoading(false);
        
        }
    }

    // Function to format the timer into MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if(!minutes && !secs){ 
            return  'resend otp?'}
        else return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(()=>{
        if(timer==0){setTimeUp(true);}
    },[timer])

    const handleChangeResendOtp = async ()=>{
        setLoading(true);
        if(timeUp && sessionStorage.getItem('email')){
            const res = await authApi('otp','POST',{email:sessionStorage.getItem('email')})
            setTimer(600)
        }
        else{
            alert('please login')
        }
        setLoading(false)
    }

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container-fluid vh-100">
            <div className="row h-100">
                {/* Left Side - Image */}
                <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center bg-light">
                    <img src={verifyimg} alt="Verification Illustration" className="img-fluid" />

                </div>

                {/* Right Side - Verification Form */}
                <div className="col-lg-6 col-md-12 d-flex align-items-center justify-content-center">
                    <div className="p-5">
                        <h2>Check Your Email For A Code</h2>
                        <p className="mb-4">Please enter the verification code sent to your email address <strong>{sessionStorage.getItem('email')}</strong></p>

                        <div className="d-flex justify-content-between mb-3">
                            {otp.map((value, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={value}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleBackspace(e, index)}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className={`form-control border ${otpError?"border-danger":"border-secondary"} text-center`}
                                    style={{ width: '3rem', fontSize: '1.5rem' }}
                                />
                            ))}
                        </div>

                        <div className="text-center mb-3">
                            <p onClick={()=>{handleChangeResendOtp()}} className="text-muted">{loading?"wait...":formatTime(timer)}</p>
                            <button onClick={handleEnter} type="submit" className={`btn ${otp[5]?"":"disabled"} btn-primary w-100`}>{loading?"please wait..":"Verify"}</button>
                            <p className="mt-3">Can't find the email? <a href="#">Click here</a> to resend.</p>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-secondary">-------- Or open with --------</p>
                            <div className="d-flex justify-content-center gap-3">
                                <button className="btn btn-outline-dark">
                                    <img src="your-gmail-logo-url.svg" alt="Gmail" style={{ width: '20px', marginRight: '8px' }} />
                                    Open Gmail
                                </button>
                                <button className="btn btn-outline-dark">
                                    <img src="your-outlook-logo-url.svg" alt="Outlook" style={{ width: '20px', marginRight: '8px' }} />
                                    Open Outlook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
