import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download,
  Trash2,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { Link } from 'react-router-dom';

// --- Types ---
interface WaitlistEntry {
  id: string;
  email: string;
  age?: number;
  role?: string;
  timestamp: Timestamp;
  referralCode?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

// --- Components ---
const MetricCard = ({ title, value, change, isPositive, icon }: MetricCardProps) => (
  <div className="bg-white p-6 rounded-[12px] border border-stone-200 shadow-sm space-y-4">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-[12px] ${
        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-800'
      }`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-stone-900">{value}</h3>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'waitlist'>('overview');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      console.error("Login error:", err);
      setAuthError(err.message || "Failed to sign in. Please check your Firebase console settings.");
    }
  };

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(collection(db, 'waitlist'), orderBy('timestamp', 'desc'), limit(500));
    
    const unsubscribe = onSnapshot(q, 
      (snap) => {
        setWaitlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaitlistEntry)));
        setLoading(false);
      },
      (error) => {
        console.error("Waitlist fetch error:", error);
        handleFirestoreError(error, OperationType.LIST, 'waitlist');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, 'waitlist', id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      handleFirestoreError(error, OperationType.DELETE, `waitlist/${id}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const exportToCSV = () => {
    if (waitlist.length === 0) return;
    
    const headers = ['Email', 'Age', 'Role', 'Joined Date', 'Referral Code'];
    const csvContent = [
      headers.join(','),
      ...waitlist.map(entry => {
        const date = entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A';
        return `"${entry.email || ''}","${entry.age || ''}","${entry.role || ''}","${date}","${entry.referralCode || ''}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kasama_waitlist_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    waitlist.forEach(entry => {
      if (!entry.timestamp?.toDate) return;
      // Use full date for accurate sorting
      try {
        const dateStr = format(entry.timestamp.toDate(), 'yyyy-MM-dd');
        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      } catch (e) {
        console.error("Invalid timestamp found:", entry.id);
      }
    });

    // Sort chronologically
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedDates.map(date => ({
      name: format(new Date(date), 'MMM dd'),
      signups: grouped[date]
    }));
  }, [waitlist]);

  if (!isAuthReady) return <div className="h-screen flex items-center justify-center bg-stone-50">Loading Auth...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[24px] border border-stone-200 shadow-2xl text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-stone-900 rounded-[12px] flex items-center justify-center shadow-xl">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Admin Login</h1>
            <p className="text-stone-500">Authorized personnel only. Please sign in with your administrator account.</p>
            {authError && <p className="text-rose-800 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{authError}</p>}
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-stone-900 text-white rounded-[12px] font-bold text-lg flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-lg"
          >
            <Users className="w-6 h-6" />
            Sign in with Google
          </button>
          <p className="text-xs text-stone-400">
            By signing in, you agree to the Kasama PH security protocols.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[24px] border border-rose-100 shadow-2xl text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-rose-50 rounded-[12px] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-800" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-stone-900">Access Denied</h2>
            <p className="text-stone-500">
              Account <span className="font-bold text-stone-900">{user.email}</span> is not authorized to access the Mission Control dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => signOut(auth)}
              className="w-full py-3 bg-stone-100 text-stone-900 rounded-xl font-bold hover:bg-stone-200 transition-all"
            >
              Sign out and try another account
            </button>
            <Link to="/" className="text-sm text-stone-400 hover:text-stone-600 font-medium">
              Return to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredWaitlist = waitlist.filter(entry => 
    entry.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">Kasama Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarLink 
            icon={<Users className="w-5 h-5" />} 
            label="Waitlist" 
            active={activeTab === 'waitlist'} 
            onClick={() => setActiveTab('waitlist')} 
          />
          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Coming Soon</p>
          </div>
          <SidebarLink icon={<ShieldAlert className="w-5 h-5" />} label="SOS Logs" disabled />
          <SidebarLink icon={<Calendar className="w-5 h-5" />} label="Schedules" disabled />
        </nav>
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="w-10 h-10 rounded-[12px] bg-stone-200 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" />
              ) : (
                <Users className="w-5 h-5 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName}</p>
              <p className="text-xs text-stone-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 p-4 sm:p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Mission Control</h1>
              <p className="text-xs sm:text-sm text-stone-500">Monitoring Kasama PH growth and safety metrics.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={exportToCSV}
                disabled={waitlist.length === 0}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button 
                onClick={() => signOut(auth)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-200 transition-all"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total Waitlist" 
                  value={waitlist.length} 
                  change="Live" 
                  isPositive={true}
                  icon={<Users className="w-6 h-6 text-stone-600" />}
                />
                <MetricCard 
                  title="Active Seniors" 
                  value="--" 
                  change="Coming Soon" 
                  isPositive={true}
                  icon={<Activity className="w-6 h-6 text-stone-600" />}
                />
                <MetricCard 
                  title="SOS Alerts (24h)" 
                  value="--" 
                  change="Coming Soon" 
                  isPositive={true}
                  icon={<ShieldAlert className="w-6 h-6 text-rose-800" />}
                />
                <MetricCard 
                  title="Adherence Rate" 
                  value="--" 
                  change="Coming Soon" 
                  isPositive={true}
                  icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[12px] border border-stone-200 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg">Waitlist Growth</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                        <div className="w-3 h-3 bg-rose-800 rounded-[12px]" /> Signups
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9f1239" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#9f1239" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: 'none', 
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="signups" 
                            stroke="#9f1239" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 italic">
                        Not enough data yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[12px] border border-stone-200 shadow-sm space-y-6 flex flex-col">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg">Recent Signups</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {waitlist.slice(0, 5).map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="flex flex-col pr-4 min-w-0">
                            <div className="font-medium text-stone-900 truncate">{entry.email || 'No Email'}</div>
                            {entry.role && (
                              <div className="text-xs text-stone-500 mt-1">{entry.role}</div>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 whitespace-nowrap">
                            {entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'MMM d, h:mm a') : 'N/A'}
                          </div>
                        </div>
                      ))}
                      {waitlist.length === 0 && !loading && (
                        <div className="text-center text-stone-400 italic py-8">No signups yet.</div>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-stone-100 flex justify-center">
                    <button 
                      onClick={() => setActiveTab('waitlist')}
                      className="text-sm font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
                    >
                      View Full Waitlist <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'waitlist' && (
            <div className="bg-white p-6 rounded-[12px] border border-stone-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-lg">Waitlist Directory</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    type="text" 
                    placeholder="Search email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Email Address</th>
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Age</th>
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Role</th>
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Referral Code</th>
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Joined</th>
                      <th className="pb-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-400 italic">
                          <div className="flex items-center justify-center gap-2">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-stone-200 border-t-stone-900 rounded-[12px]"
                            />
                            Loading waitlist...
                          </div>
                        </td>
                      </tr>
                    ) : filteredWaitlist.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-400 italic">
                          No waitlist entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredWaitlist.map((entry) => (
                        <tr key={entry.id} className="group hover:bg-stone-50/50 transition-colors">
                          <td className="py-4 font-medium text-stone-900">{entry.email}</td>
                          <td className="py-4 text-sm text-stone-500">{entry.age || '-'}</td>
                          <td className="py-4 text-sm text-stone-500">
                            {entry.role ? (
                              <span className="px-2 py-1 bg-stone-100 rounded-md text-xs font-medium">
                                {entry.role}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-4 text-sm text-stone-500 font-mono">{entry.referralCode || '-'}</td>
                          <td className="py-4 text-sm text-stone-500">
                            {entry.timestamp ? format(entry.timestamp.toDate(), 'MMM d, yyyy h:mm a') : 'N/A'}
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleDelete(entry.id)}
                              disabled={isDeleting === entry.id}
                              className="p-2 text-stone-400 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 pb-6 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'overview' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Overview</span>
        </button>
        <button 
          onClick={() => setActiveTab('waitlist')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'waitlist' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Waitlist</span>
        </button>
      </nav>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, disabled = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
        active 
          ? 'bg-stone-900 text-white shadow-lg shadow-stone-200' 
          : disabled
            ? 'text-stone-300 cursor-not-allowed'
            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
