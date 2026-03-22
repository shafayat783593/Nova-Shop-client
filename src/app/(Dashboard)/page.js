// 'use client';

// import { useAuth } from "../context/AuthContext";


// const StatCard = ({ title, value, color }) => (
//     <div className="p-6 bg-card rounded-3xl border border-accent-10 shadow-sm transition-transform hover:scale-105">
//         <p className="text-body text-sm font-bold uppercase tracking-wider">{title}</p>
//         <h3 className={`text-3xl font-black mt-2 ${color}`}>{value}</h3>
//     </div>
// );

// export default function DashboardPage() {
//     const { user } = useAuth();
//     const role = user?.role?.toLowerCase();

//     return (
//         <div className="space-y-8 animate-in fade-in duration-700">
//             <div>
//                 <h1 className="text-4xl font-display font-black text-heading">Hello, {user?.name}! 👋</h1>
//                 <p className="text-body mt-2">Welcome to your <span className="text-primary dark:text-accent font-bold">{role}</span> dashboard.</p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {role === 'admin' && (
//                     <>
//                         <StatCard title="Total Users" value="1,250" color="text-primary dark:text-accent" />
//                         <StatCard title="Revenue" value="$45,200" color="text-success" />
//                         <StatCard title="Pending Requests" value="12" color="text-danger" />
//                         <StatCard title="Active Vendors" value="48" color="text-secondary" />
//                     </>
//                 )}
//                 {role === 'vendor' && (
//                     <>
//                         <StatCard title="My Sales" value="$4,500" color="text-success" />
//                         <StatCard title="Products" value="24" color="text-primary dark:text-accent" />
//                         <StatCard title="Orders" value="156" color="text-secondary" />
//                         <StatCard title="Wallet Balance" value="$850" color="text-primary" />
//                     </>
//                 )}
//                 {role === 'customer' && (
//                     <>
//                         <StatCard title="Active Orders" value="3" color="text-primary dark:text-accent" />
//                         <StatCard title="Spent Total" value="$1,200" color="text-success" />
//                         <StatCard title="Reward Points" value="450" color="text-secondary" />
//                         <StatCard title="Support Tickets" value="1" color="text-danger" />
//                     </>
//                 )}
//             </div>

//             {/* Recent Activity Table (Common for all) */}
//             <div className="bg-card rounded-3xl border border-accent-10 p-6 overflow-hidden">
//                 <h4 className="text-xl font-bold text-heading mb-4">Recent Activity</h4>
//                 <div className="text-body italic">No recent activities to show...</div>
//             </div>
//         </div>
//     );
// }