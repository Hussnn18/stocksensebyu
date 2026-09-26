import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { API_BASE_URL } from './lib/constants';
import {
  Boxes, 
  Truck, 
  Layers, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  History, 
  Warehouse, 
  BellRing, 
  ArrowRight, 
  ArrowUpRight,
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  FileSpreadsheet, 
  X, 
  Mail, 
  Lock, 
  User, 
  KeyRound,
  ChevronRight,
  Play,
  Loader2,
  ExternalLink,
  AlertCircle,
  MailCheck,
  LogOut,
  UserCheck,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  // Navigation / Modal States
  const [activeModuleId, setActiveModuleId] = useState('receipts');
  const [activePriority, setActivePriority] = useState('Save time');
  const [audienceTab, setAudienceTab] = useState('managers'); // 'managers' | 'staff'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin'); // 'signin' | 'signup' | 'otp'
  const [demoStep, setDemoStep] = useState(1);

  // Auth & Nodemailer form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signupRole, setSignupRole] = useState('manager');
  
  // OTP Reset & Verification state
  const [otpStep, setOtpStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);
  const [demoOtpCode, setDemoOtpCode] = useState(null);
  
  // Async status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authNotification, setAuthNotification] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  // Logged-in user lives in AuthContext so the dashboard (and a page reload) can see it.
  const { user: authenticatedUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // OTP reset step 3 (new password)
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  // 8 Core Operations (Matching Image 1 Grid)
  const modules = [
    {
      id: 'products',
      title: 'Product Management',
      desc: 'Create/update products with SKU, category, UoM & initial stock.',
      badge: 'Master Data',
      icon: Boxes,
      color: 'text-blue-600',
      action: 'Manage SKUs'
    },
    {
      id: 'receipts',
      title: 'Receipts (Incoming Stock)',
      desc: 'Receive goods from vendors → Validate → Stock increases automatically.',
      badge: 'Inbound Flow',
      icon: Truck,
      color: 'text-emerald-600',
      action: 'Receive Goods'
    },
    {
      id: 'delivery',
      title: 'Delivery Orders (Outgoing)',
      desc: 'Pick items → Pack items → Validate → Stock decreases automatically.',
      badge: 'Outbound Flow',
      icon: Layers,
      color: 'text-indigo-600',
      action: 'Pick & Pack'
    },
    {
      id: 'transfers',
      title: 'Internal Transfers',
      desc: 'Move stock: Main Store ➔ Production Floor (Rack A ➔ Rack B).',
      badge: 'Relocation',
      icon: ArrowRightLeft,
      color: 'text-cyan-600',
      action: 'Transfer Stock'
    },
    {
      id: 'adjustments',
      title: 'Inventory Adjustment',
      desc: 'Fix mismatches between physical count and system recorded stock.',
      badge: 'Audit & Count',
      icon: SlidersHorizontal,
      color: 'text-amber-600',
      action: 'Adjust Count'
    },
    {
      id: 'ledger',
      title: 'Move History & Ledger',
      desc: 'Real-time immutable log of every movement with timestamp and user.',
      badge: 'Audit Trail',
      icon: History,
      color: 'text-blue-700',
      action: 'View History'
    },
    {
      id: 'warehouse',
      title: 'Warehouse & Locations',
      desc: 'Configure central warehouses, production annexes, racks, and bays.',
      badge: 'Settings',
      icon: Warehouse,
      color: 'text-slate-700',
      action: 'Setup Zones'
    },
    {
      id: 'alerts',
      title: 'Low Stock Alerts',
      desc: 'Automatic notifications when items drop below minimum safety levels.',
      badge: 'Automation',
      icon: BellRing,
      color: 'text-rose-600',
      action: 'Set Rules'
    }
  ];

  // 6 Priority Options (Matching Image 2 Scoping Card)
  const priorityOptions = [
    { id: 'Save time', label: 'Save time', icon: Clock },
    { id: 'Grow revenue', label: 'Grow revenue', icon: TrendingUp },
    { id: 'Boost accuracy', label: 'Boost accuracy', icon: ShieldCheck },
    { id: 'Make better decisions', label: 'Make better decisions', icon: Sparkles },
    { id: 'Build custom rules', label: 'Build custom rules', icon: SlidersHorizontal },
    { id: 'Replace Excel sheets', label: 'Replace Excel sheets', icon: FileSpreadsheet },
  ];

  // 4-Step Simplified Inventory Flow (Matching User Prompt)
  const flowSteps = [
    {
      step: 1,
      title: 'Receive Goods from Vendor',
      detail: 'Receive 100 kg Steel Rods from supplier.',
      stockMath: 'Stock: +100 kg',
      highlight: 'Main Store Bay: 100 kg'
    },
    {
      step: 2,
      title: 'Move to Production Rack',
      detail: 'Internal transfer: Main Store ➔ Production Rack.',
      stockMath: 'Stock unchanged in total (Location updated)',
      highlight: 'Production Floor: 100 kg'
    },
    {
      step: 3,
      title: 'Deliver Finished Goods',
      detail: 'Customer dispatch order for 20 kg steel frames.',
      stockMath: 'Stock: –20 kg (100 ➔ 80 kg)',
      highlight: 'Dispatched to Client'
    },
    {
      step: 4,
      title: 'Adjust Damaged Items',
      detail: '3 kg steel damaged during handling written off.',
      stockMath: 'Stock: –3 kg (80 ➔ 77 kg)',
      highlight: 'Scrap Logged in Ledger'
    }
  ];

  // Handlers for Nodemailer API actions
  const handleOpenAuth = (tab) => {
    setAuthTab(tab);
    setOtpStep(1);
    setOtpInput('');
    setEmailPreviewUrl(null);
    setDemoOtpCode(null);
    setResetToken(null);
    setNewPassword('');
    setConfirmPassword('');
    setAuthNotification(null);
    setAuthModalOpen(true);
  };

  const handleSendOtpSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsSubmitting(true);
    setAuthNotification(null);
    setEmailPreviewUrl(null);
    setDemoOtpCode(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not send verification email.');
      }

      setOtpStep(2);
      if (data.previewUrl) setEmailPreviewUrl(data.previewUrl);
      if (data.demoCode) setDemoOtpCode(data.demoCode);
      setAuthNotification({ type: 'success', message: data.message });
    } catch (err) {
      setAuthNotification({
        type: 'error',
        message: err.message || 'Failed to connect to mail server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 6) {
      setAuthNotification({ type: 'error', message: 'Please enter the full 6-digit code.' });
      return;
    }

    setIsSubmitting(true);
    setAuthNotification(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: otpInput }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      // Code is correct: move to step 3 to choose a new password
      setResetToken(data.resetToken);
      setOtpStep(3);
      setAuthNotification(null);
    } catch (err) {
      setAuthNotification({
        type: 'error',
        message: err.message || 'Verification failed. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setAuthNotification({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthNotification({ type: 'error', message: 'The two passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    setAuthNotification(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not update the password.');
      }

      // Back to sign in with the email filled in
      setSignInEmail(resetEmail);
      setSignInPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken(null);
      setOtpInput('');
      setOtpStep(1);
      setAuthTab('signin');
      setAuthNotification({ type: 'success', message: data.message });
    } catch (err) {
      setAuthNotification({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword) return;

    setIsSubmitting(true);
    setAuthNotification(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          role: signupRole,
          password: signUpPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Signup failed.');
      }

      // Pre-fill email in Sign In tab and prompt user to log in
      setSignInEmail(signUpEmail);
      setSignInPassword('');
      setSignUpPassword('');
      setAuthTab('signin');
      setAuthNotification({ type: 'success', message: data.message });
    } catch (err) {
      setAuthNotification({
        type: 'error',
        message: err.message || 'Failed to sign up. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setAuthNotification({ type: 'error', message: 'Email and password are required.' });
      return;
    }

    setIsSubmitting(true);
    setAuthNotification(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      login(data.user, data.token);
      setSignInPassword('');
      setAuthModalOpen(false);
      setAuthNotification(null);
      navigate('/dashboard'); // the brief: after login, go to the Inventory Dashboard
    } catch (err) {
      setAuthNotification({
        type: 'error',
        message: err.message || 'Invalid email or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // The app sends logged-out visitors to "/?auth=signin" so the sign-in modal opens straight away.
  useEffect(() => {
    const tab = searchParams.get('auth');
    if (!tab) return;
    setSearchParams({}, { replace: true });
    if (authenticatedUser) navigate('/dashboard');
    else handleOpenAuth(tab === 'signup' ? 'signup' : 'signin');
    // Runs only when the query string changes.
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      
      {/* 1. NAVBAR (Matching Topflow Layout: Logo Far Left, Links in Center, Login with arrow & Get started Far Right) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 h-18 flex items-center justify-between">
          
          {/* Logo (Far Left) */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="font-cursive text-2xl font-bold text-slate-900 tracking-wide select-none">
              Stock<span className="text-blue-600">Sense</span>
            </span>
          </div>



          {/* Centered Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#modules" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <span>Operations</span>
              <span className="text-xs text-slate-400 font-normal">+</span>
            </a>
            <a href="#scoping" className="hover:text-blue-600 transition-colors">Assessment</a>
            <a href="#flow" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          </nav>

          {/* Action buttons (Far Right: Circular Logo Popup OR Login / Get Started) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {authenticatedUser ? (
              <div className="relative">
                {/* Circular Logo Button */}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/20 hover:ring-4 hover:ring-blue-500/20 transition-all cursor-pointer relative select-none"
                  title="Open user profile menu"
                >
                  <span>{authenticatedUser.name ? authenticatedUser.name[0].toUpperCase() : '?'}</span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0"></span>
                </button>

                {/* Square Box with Rounded Corners Dropdown */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150 text-left">
                      
                      {/* Top User Info */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-inner shrink-0 uppercase">
                          {authenticatedUser.name ? authenticatedUser.name[0].toUpperCase() : '?'}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-extrabold text-slate-900 text-sm truncate capitalize">
                            {authenticatedUser.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate font-normal">
                            {authenticatedUser.email}
                          </div>
                        </div>
                      </div>

                      {/* Position / Role Card */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Current Position
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-sm">
                            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="capitalize">
                              {authenticatedUser.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Open the inventory dashboard */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-2 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Open dashboard</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-slate-100 mb-3"></div>

                      {/* Logout Button */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold text-rose-600 hover:text-white bg-rose-50/80 hover:bg-rose-600 transition-all cursor-pointer group"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Log out</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth('signin')}
                  className="text-slate-800 hover:text-blue-600 font-semibold text-sm flex items-center gap-1 transition-colors cursor-pointer group"
                >
                  <span>Log in</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>


      {/* 2. HERO SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Modular Inventory Management System</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-normal">Real-Time Stock OS</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-[-0.035em] leading-[1.08] mb-6 drop-shadow-xs">
            Digitize & Streamline Your <br className="hidden sm:inline" />
            <span className="text-blue-600 font-black">Inventory Operations</span>
          </h1>


          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Replace manual registers and messy Excel sheets with a centralized, real-time app. 
            Built for <strong>Inventory Managers</strong> and <strong>Warehouse Staff</strong> to manage Receipts, Deliveries, Transfers, and Adjustments seamlessly.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={() => handleOpenAuth('signup')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 py-3.5 rounded-full shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#modules"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base px-8 py-3.5 rounded-full border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Operations</span>
            </a>
          </div>

          {/* 4 Clean Quick Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total In Stock</div>
              <div className="text-2xl font-black text-slate-900 mt-1">513 <span className="text-xs font-normal text-slate-500">items</span></div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Real-time sync</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Low Stock Items</div>
              <div className="text-2xl font-black text-amber-600 mt-1">2 <span className="text-xs font-normal text-slate-500">SKUs</span></div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">● Reorder triggered</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Pending Receipts</div>
              <div className="text-2xl font-black text-slate-900 mt-1">150 <span className="text-xs font-normal text-slate-500">kg</span></div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">Vendor inbound</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Internal Transfers</div>
              <div className="text-2xl font-black text-slate-900 mt-1">50 <span className="text-xs font-normal text-slate-500">kg</span></div>
              <div className="text-[11px] text-cyan-600 font-semibold mt-1">Store ➔ Prod Floor</div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. MODULAR OPERATIONS GRID (Matching Screenshot 1 Grid) */}
      <section id="modules" className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Find solutions for every type of stock operation
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-10">
            Modular tools built to digitize incoming goods, outgoing orders, internal moves, and physical audits.
          </p>

          {/* 8 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {modules.map((item) => {
              const Icon = item.icon;
              const isActive = activeModuleId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveModuleId(item.id)}
                  className={`p-6 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'border-2 border-blue-600 shadow-md ring-4 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{item.action}</span>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE SCOPING CARD (Matching Screenshot 2) */}
      <section id="scoping" className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-blue-100/80 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Free Inventory Assessment</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Not sure where your warehouse is losing stock?
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Answer three quick questions. Get matched to the right inventory modules and automated reorder rules.
              </p>
            </div>

            {/* Right Interactive Card (Screenshot 2 design) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8">
                
                {/* Header with progress */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Question 1 of 3</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-2 rounded-full bg-blue-600"></div>
                    <div className="w-8 h-2 rounded-full bg-slate-200"></div>
                    <div className="w-8 h-2 rounded-full bg-slate-200"></div>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-5">
                  What's your top business priority?
                </h3>

                {/* 6 Priority Options (3 columns on sm/md) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {priorityOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = activePriority === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setActivePriority(opt.id)}
                        className={`p-3.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleOpenAuth('signup')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue & View Recommendation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Tab: "How it works: For Inventory Managers / For Warehouse Staff" */}
          <div className="mt-14 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-slate-900">How it works</h3>
            
            <div className="inline-flex p-1 bg-slate-200/80 rounded-full text-xs font-semibold">
              <button
                onClick={() => setAudienceTab('managers')}
                className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                  audienceTab === 'managers' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                For Inventory Managers
              </button>
              <button
                onClick={() => setAudienceTab('staff')}
                className={`px-5 py-1.5 rounded-full transition-all cursor-pointer ${
                  audienceTab === 'staff' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                }`}
              >
                For Warehouse Staff
              </button>
            </div>
          </div>

          {/* 3 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {audienceTab === 'managers' ? (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-blue-600 mb-1">01. Setup Catalog</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Define Products & Rules</h4>
                  <p className="text-xs text-slate-500">Create SKUs, categories, units of measure, and safety stock thresholds.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-blue-600 mb-1">02. Review POs & Orders</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Inbound & Outbound</h4>
                  <p className="text-xs text-slate-500">Track vendor receipts, customer dispatch orders, and reorder alerts.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-blue-600 mb-1">03. Audit Ledger</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Real-Time Move History</h4>
                  <p className="text-xs text-slate-500">Approve count adjustments and maintain 100% audit traceability.</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 mb-1">01. Receive Items</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Verify at Inbound Dock</h4>
                  <p className="text-xs text-slate-500">Input quantities received and click validate to auto-increment stock.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 mb-1">02. Transfer & Shelve</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Rack-to-Rack Moves</h4>
                  <p className="text-xs text-slate-500">Move goods between aisles, racks, and production floors easily.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 mb-1">03. Pick & Pack</div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Validate Outgoing Stock</h4>
                  <p className="text-xs text-slate-500">Follow pick checklists, pack boxes, and auto-decrease inventory.</p>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* 6. SIMPLIFIED 4-STEP INVENTORY FLOW (Matching Prompt Example) */}
      <section id="flow" className="py-16 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          
          <div className="max-w-3xl mb-10">
            <div className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block mb-2">
              End-to-End Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Simplified Example of the Complete Inventory Flow
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">
              Everything entering, moving, or exiting the warehouse is automatically logged in the Stock Ledger.
            </p>
          </div>

          {/* 4 Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flowSteps.map((st) => (
              <div 
                key={st.step}
                className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      {st.step}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">Step 0{st.step}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{st.detail}</p>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs font-mono font-bold text-blue-700">{st.stockMath}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{st.highlight}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. SPLIT-SCREEN AUTH MODAL (Matching Reference Image) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left relative animate-in fade-in zoom-in-95 duration-150 grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            
            {/* Close Button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-900 bg-white/80 hover:bg-white rounded-full border border-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <X className="w-5 h-5" />
            </button>

            {/* LEFT COLUMN: Clean Form */}
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
              <div>
                
                {/* Top Minimalist Geometric Icon */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-slate-900">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <span className="font-cursive text-xl font-bold text-slate-900">
                    Stock<span className="text-blue-600">Sense</span>
                  </span>
                </div>

                {/* Form Title & Subhead */}
                <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight mb-1.5">
                  {authTab === 'signin' && 'Welcome back!'}
                  {authTab === 'signup' && 'Create an account'}
                  {authTab === 'otp' && 'Reset password'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-normal mb-7">
                  {authTab === 'signin' && 'Your work, your team, your flow — all in one place.'}
                  {authTab === 'signup' && 'Start digitizing your inventory & warehouse flow in seconds.'}
                  {authTab === 'otp' && otpStep === 1 && 'Enter your email to receive a 6-digit verification code.'}
                  {authTab === 'otp' && otpStep === 2 && 'Enter the 6-digit code from your email.'}
                  {authTab === 'otp' && otpStep === 3 && 'Choose a new password for your account.'}
                </p>

                {/* Top Notification Alert (Errors or Step 1 Confirmation) */}
                {authNotification && (authNotification.type === 'error' || otpStep === 1) && (
                  <div className={`mb-5 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                    authNotification.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : authNotification.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {authNotification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{authNotification.message}</span>
                  </div>
                )}

                {/* Form Fields: Sign In */}
                {authTab === 'signin' && (
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <input
                        type="password"
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                    >
                      <span>Sign in with email</span>
                    </button>
                  </form>
                )}

                {/* Form Fields: Sign Up (Dispatches Nodemailer Welcome Email) */}
                {authTab === 'signup' && (
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    <div>
                      <input
                        type="text"
                        required
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Full name"
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 ml-0.5">Select your role</label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-800 font-medium cursor-pointer"
                      >
                        <option value="manager">Inventory Manager (Approvals & Reordering)</option>
                        <option value="staff">Warehouse Staff (Floor Picking & Transfers)</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a password (8+ characters)"
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching Welcome Email...</span>
                        </>
                      ) : (
                        <span>Create account</span>
                      )}
                    </button>
                  </form>
                )}

                {/* Form Fields: OTP Reset (Dispatches Nodemailer 6-digit Code) */}
                {authTab === 'otp' && (
                  <div>
                    {otpStep === 1 ? (
                      <form onSubmit={handleSendOtpSubmit} className="space-y-4">
                        <div>
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-slate-950 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending OTP via Nodemailer...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span>Send 6-digit OTP</span>
                            </>
                          )}
                        </button>
                      </form>
                    ) : otpStep === 3 ? (
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Code verified for <strong>{resetEmail}</strong>.</span>
                        </div>
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (8+ characters)"
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                        />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white placeholder:text-slate-400"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-slate-950 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating password...</span>
                            </>
                          ) : (
                            <span>Update password</span>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                        <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              Code sent to: <span className="text-blue-700 font-bold">{resetEmail}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => { setOtpStep(1); setAuthNotification(null); }}
                              className="text-[11px] text-blue-700 underline font-semibold hover:text-blue-900 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                            Please check your inbox or <strong>Spam / Junk</strong> folder for the 6-digit code.
                          </p>

                          {/* Live Sandbox Preview Link (Only if Ethereal sandbox is active) */}
                          {emailPreviewUrl && (
                            <div className="pt-2 border-t border-blue-200/70 flex items-center justify-between">
                              <span className="text-[11px] text-blue-700">Sandbox active</span>
                              <a
                                href={emailPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-[11px] text-blue-800 bg-white px-2.5 py-1 rounded-md border border-blue-300 hover:bg-blue-100 transition-colors shadow-2xs"
                              >
                                <span>Preview in Ethereal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {demoOtpCode && (
                            <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                              <span className="text-[11px] text-slate-500">Test Code: <code className="font-bold text-blue-800">{demoOtpCode}</code></span>
                              <button
                                type="button"
                                onClick={() => setOtpInput(demoOtpCode)}
                                className="text-[11px] text-blue-700 font-bold hover:underline"
                              >
                                Auto-fill
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="w-full text-center tracking-[0.3em] font-mono font-bold text-xl px-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-slate-950 hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Verifying code...</span>
                            </>
                          ) : (
                            <span>Verify code</span>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Switch Login / Signup Text */}
                <div className="mt-6 text-center text-xs text-slate-500 space-y-1.5">
                  {authTab === 'signin' ? (
                    <div>
                      <span>Don't have an account? </span>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('signup'); setOtpStep(1); }}
                        className="text-slate-900 font-bold hover:underline cursor-pointer"
                      >
                        Sign Up
                      </button>
                      <span className="mx-2 text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('otp'); setOtpStep(1); }}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span>Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('signin'); setOtpStep(1); }}
                        className="text-slate-900 font-bold hover:underline cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>


            {/* RIGHT COLUMN: Dithered Artistic Illustration Panel (Zoomed In) */}
            <div className="hidden lg:block lg:col-span-6 relative bg-slate-950 border-l border-slate-100 overflow-hidden">
              <img
                src="/auth_art.jpg"
                alt="Architectural artwork"
                className="w-full h-full object-cover scale-145 object-center grayscale contrast-130 brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
            </div>

          </div>
        </div>
      )}


      {/* 8. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto text-left text-xs text-slate-500">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span className="font-cursive text-xl font-bold text-slate-900">
              Stock<span className="text-blue-600">Sense</span>
            </span>
            <span className="text-slate-400">— Modular Inventory Management System</span>
          </div>

          <div>
            Built with React.js + Tailwind CSS & Express + MySQL backend architecture.
          </div>
        </div>
      </footer>

    </div>
  );
}
