// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonLoading, IonAlert, IonInput, IonLabel, IonItem, IonSegment, IonSegmentButton, IonText, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const { login, register, verifyOTP, pendingUserId, isLoading, isAuthenticated } = useAuth();
  
  console.log("🚀 Login component rendered");
  console.log("📊 Auth state in Login:", { pendingUserId, isLoading, isAuthenticated });

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    otp: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("✅ User already authenticated, redirecting to /home");
      history.replace('/home');
    }
  }, [isAuthenticated, history]);

  const validateForm = () => {
    console.log("🔍 Validating form...");
    const newErrors: Record<string, string> = {};

    if (!isOtpMode) {
      if (mode === 'register' && !formData.name.trim()) {
        newErrors.name = 'Name is required';
        console.log("❌ Name validation failed");
      }
      
      if (!formData.email && !formData.mobile) {
        newErrors.email = 'Email or Mobile is required';
        newErrors.mobile = 'Email or Mobile is required';
        console.log("❌ Email/Mobile validation failed - both empty");
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
        console.log("❌ Email format validation failed");
      }
      
      if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Invalid mobile number (10 digits required)';
        console.log("❌ Mobile format validation failed");
      }
    } else {
      if (!formData.otp.trim()) {
        newErrors.otp = 'OTP is required';
        console.log("❌ OTP validation failed - empty");
      } else if (!/^\d{6}$/.test(formData.otp)) {
        newErrors.otp = 'OTP must be 6 digits';
        console.log("❌ OTP validation failed - not 6 digits");
      }
    }

    console.log("📋 Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("🔄 Submit button clicked");
    console.log("📝 Form data:", formData);
    console.log("📱 Current mode:", { mode, isOtpMode, pendingUserId });

    if (!validateForm()) {
      console.log("❌ Form validation failed, stopping");
      return;
    }

    setIsProcessing(true);

    try {
      if (!isOtpMode) {
        console.log("📤 Making API call for:", mode);
        if (mode === 'login') {
          if (formData.email) {
            await login(formData.email, undefined);
          } else {
            await login(undefined, formData.mobile);
          }
        } else {
          if (formData.email) {
            await register(formData.name, formData.email, undefined);
          } else {
            await register(formData.name, undefined, formData.mobile);
          }
        }
        console.log("✅ API call successful, switching to OTP mode");
        setIsOtpMode(true);
      } else {
        console.log("✅ Verifying OTP for user:", pendingUserId);
        if (pendingUserId) {
          await verifyOTP(pendingUserId, formData.otp);
          console.log("🎉 OTP verification successful, should redirect automatically");
          // The useEffect will handle redirect when isAuthenticated changes
        } else {
          console.error("❌ No pendingUserId found!");
          setAlertMessage('Session expired. Please start again.');
          setShowAlert(true);
        }
      }
    } catch (error: any) {
      console.error("❌ API Error details:", error);
      setAlertMessage(error.message || 'An error occurred. Please try again.');
      setShowAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    console.log("🔙 Back button clicked");
    setIsOtpMode(false);
    setFormData(prev => ({ ...prev, otp: '' }));
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    console.log(`✏️ ${field} changed:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="auth-toolbar">
          <IonTitle className="auth-title">
            {isOtpMode ? 'Verify OTP' : mode === 'login' ? 'Login' : 'Register'}
          </IonTitle>
          <IonButtons slot="end">
            {isOtpMode && (
              <IonButton onClick={handleBack} className="back-button" fill="clear">
                <span className="button-text">Back</span>
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="auth-content" scrollY={true}>
        <div className="auth-container">
          {!isOtpMode && (
            <div className="mode-selector">
              <IonSegment 
                value={mode} 
                onIonChange={e => {
                  console.log("🔄 Mode changed to:", e.detail.value);
                  setMode(e.detail.value as 'login' | 'register');
                  setErrors({});
                }}
                className="auth-segment"
              >
                <IonSegmentButton value="login" className="segment-button">
                  <IonLabel className="segment-label">Login</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="register" className="segment-button">
                  <IonLabel className="segment-label">Register</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>
          )}

          <div className="form-container">
            {isOtpMode ? (
              <>
                <div className="otp-header">
                  <h2 className="otp-title">Enter OTP</h2>
                  <p className="otp-subtitle">
                    Enter the 6-digit OTP sent to your {formData.email ? 'email' : 'mobile'}
                  </p>
                </div>
                
                <div className="form-group">
                  <div className="input-container">
                    <IonLabel className="input-label">OTP Code</IonLabel>
                    <div className="input-wrapper">
                      <IonInput
                        type="tel"
                        inputmode="numeric"
                        maxlength={6}
                        value={formData.otp}
                        onIonChange={e => handleInputChange('otp', e.detail.value || '')}
                        className="form-input otp-input"
                        autofocus
                        placeholder="123456"
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.otp && <div className="error-message">{errors.otp}</div>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-header">
                  <h2 className="form-title">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="form-subtitle">
                    {mode === 'login' 
                      ? 'Sign in to continue to your dashboard' 
                      : 'Fill in your details to get started'}
                  </p>
                </div>

                {mode === 'register' && (
                  <div className="form-group">
                    <div className="input-container">
                      <IonLabel className="input-label">Full Name</IonLabel>
                      <div className="input-wrapper">
                        <IonInput
                          type="text"
                          value={formData.name}
                          onIonChange={e => handleInputChange('name', e.detail.value || '')}
                          className="form-input"
                          placeholder="Enter your full name"
                        />
                        <div className="input-border"></div>
                      </div>
                      {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="input-container">
                    <IonLabel className="input-label">Email Address</IonLabel>
                    <div className="input-wrapper">
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonChange={e => {
                          handleInputChange('email', e.detail.value || '');
                          if (e.detail.value) handleInputChange('mobile', '');
                        }}
                        className="form-input"
                        placeholder="you@example.com"
                        disabled={!!formData.mobile}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                </div>

                <div className="divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">OR</span>
                  <span className="divider-line"></span>
                </div>

                <div className="form-group">
                  <div className="input-container">
                    <IonLabel className="input-label">Mobile Number</IonLabel>
                    <div className="input-wrapper">
                      <IonInput
                        type="tel"
                        inputmode="numeric"
                        value={formData.mobile}
                        onIonChange={e => {
                          handleInputChange('mobile', e.detail.value || '');
                          if (e.detail.value) handleInputChange('email', '');
                        }}
                        className="form-input"
                        placeholder="10-digit mobile number"
                        disabled={!!formData.email}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.mobile && <div className="error-message">{errors.mobile}</div>}
                  </div>
                </div>
              </>
            )}

            <div className="action-buttons">
              <IonButton 
                expand="block" 
                onClick={handleSubmit}
                className="submit-button"
                disabled={isProcessing || isLoading}
              >
                {isProcessing 
                  ? (isOtpMode ? 'Verifying...' : mode === 'login' ? 'Sending OTP...' : 'Registering...')
                  : isOtpMode 
                    ? 'Verify & Continue' 
                    : mode === 'login' 
                      ? 'Send OTP' 
                      : 'Register & Send OTP'}
              </IonButton>

              {!isOtpMode && (
                <div className="switch-mode">
                  <IonText className="switch-text">
                    {mode === 'login' 
                      ? "Don't have an account? " 
                      : "Already have an account? "}
                    <button 
                      className="switch-link"
                      onClick={() => {
                        console.log("🔄 Switching mode from", mode, "to", mode === 'login' ? 'register' : 'login');
                        setMode(mode === 'login' ? 'register' : 'login');
                        setErrors({});
                      }}
                      type="button"
                    >
                      {mode === 'login' ? 'Create Account' : 'Sign In'}
                    </button>
                  </IonText>
                </div>
              )}
            </div>

            <div className="debug-info" style={{ display: 'none' }}>
              <IonGrid>
                <IonRow>
                  <IonCol>
                    <small>Debug: pendingUserId={String(pendingUserId)}</small>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            <div className="otp-note">
              <div className="note-icon">ℹ️</div>
              <IonText className="note-text">
                <strong>Development Note:</strong> OTP will be displayed in your backend terminal/console.
              </IonText>
            </div>
          </div>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => {
            console.log("📢 Alert dismissed");
            setShowAlert(false);
          }}
          header="Error"
          message={alertMessage}
          buttons={['OK']}
          className="error-alert"
        />

        <IonLoading 
          isOpen={isProcessing || isLoading} 
          message={isProcessing ? "Processing..." : "Loading..."} 
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;