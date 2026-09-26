import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  Sparkles,
  Boxes,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function AuthModal({ isOpen, onClose, initialTab = 'signin', onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'signin' | 'signup' | 'otp_reset'
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('inventory_manager');
  const [signupCompany, setSignupCompany] = useState('');

  // OTP Reset State
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(120);

  if (!isOpen) return null;

  const handleDemoLogin = (role) => {
    const user = role === 'inventory_manager' 
      ? { id: 'u-1', name: 'Sarah Jenkins', email: 'sarah.j@stocksense.app', role: 'inventory_manager', company: 'Nexus Logistics Global' }
      : { id: 'u-2', name: 'David Kim', email: 'david.k@stocksense.app', role: 'warehouse_staff', company: 'Nexus Logistics Global' };
    
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch(e) {}
    
    onLoginSuccess(user);
    onClose();
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    const user = {
      id: 'u-' + Date.now(),
      name: loginEmail.split('@')[0] || 'Operations Lead',
      email: loginEmail || 'manager@stocksense.app',
      role: 'inventory_manager',
      company: 'Central Warehouse Corp'
    };
    onLoginSuccess(user);
    onClose();
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    const user = {
      id: 'u-' + Date.now(),
      name: signupName || 'New Manager',
      email: signupEmail || 'lead@stocksense.app',
      role: signupRole,
      company: signupCompany || 'Industrial Logistics Ltd'
    };
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch(e) {}
    onLoginSuccess(user);
    onClose();
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // auto focus next input if character entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setResetStep(3);
  };

  const handleFinishReset = (e) => {
    e.preventDefault();
    const user = {
      id: 'u-reset',
      name: resetEmail.split('@')[0] || 'Verified User',
      email: resetEmail,
      role: 'inventory_manager',
      company: 'Enterprise Supply Co.'
    };
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch(e) {}
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight">StockSense IMS Authentication</h3>
          <p className="text-xs text-blue-100 mt-0.5">Secure access for Inventory Managers & Warehouse Staff</p>

          {/* Tab Pill */}
          <div className="mt-4 inline-flex p-1 bg-white/15 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('signin'); setResetStep(1); }}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setResetStep(1); }}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setActiveTab('otp_reset'); setResetStep(1); }}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'otp_reset' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              OTP Reset
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          
          {/* 1-Click Fast Demo Buttons */}
          <div className="mb-6 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Instant 1-Click Role Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('inventory_manager')}
                className="p-2 bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group"
              >
                <span>👔 Inventory Manager</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('warehouse_staff')}
                className="p-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group"
              >
                <span>📦 Warehouse Staff</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">or enter credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="sarah.jenkins@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('otp_reset'); setResetStep(1); }}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot Password (OTP)?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    placeholder="Nexus Logistics Group"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role in Warehouse</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                >
                  <option value="inventory_manager">Inventory Manager (Purchasing & Reorder Rules)</option>
                  <option value="warehouse_staff">Warehouse Floor Staff (Picking, Transfers & Shelving)</option>
                  <option value="admin">Operations Admin / Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="sarah@nexuslogistics.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Create IMS Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: OTP-BASED PASSWORD RESET */}
          {activeTab === 'otp_reset' && (
            <div>
              {/* Step 1: Enter Email */}
              {resetStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 border border-blue-100">
                    Enter your registered email. We'll send a 6-digit one-time password (OTP) to verify your identity.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="sarah.jenkins@company.com"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Enter 6-digit OTP */}
              {resetStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span>OTP sent to <strong>{resetEmail || 'your email'}</strong></span>
                      <div className="text-[10px] text-emerald-600 font-mono mt-0.5">Demo Code: 482910</div>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold">01:59</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Enter 6-Digit OTP</label>
                    <div className="flex items-center justify-between gap-2">
                      {otpCode.map((val, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-11 h-12 text-center font-mono font-bold text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-blue-50/30"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Didn't receive code?</span>
                    <button type="button" className="font-bold text-blue-600 hover:underline cursor-pointer">Resend OTP</button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Verify Code</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 3: Set New Password */}
              {resetStep === 3 && (
                <form onSubmit={handleFinishReset} className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Identity verified successfully! Enter your new password.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Update Password & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
