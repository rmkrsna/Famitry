
import React, { useState } from 'react';
import { Phone, ArrowRight, Loader2, Sparkles, UserCheck, Lock, X } from 'lucide-react';
import { FamilyMember, RelationType } from '../types';

interface LoginScreenProps {
  members: Record<string, FamilyMember>;
  onLogin: (userId: string) => void;
  onRegister: (newMember: FamilyMember) => void;
  onClaim: (memberId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ members, onLogin, onRegister, onClaim }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'REGISTER'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedMemberId, setMatchedMemberId] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  // Registration State
  const [regData, setRegData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    caste: ''
  });

  const handleSendOtp = () => {
    if (phone.length < 10) return alert("Please enter a valid phone number");
    setLoading(true);
    
    // Simulate API Check
    setTimeout(() => {
        setLoading(false);
        setStep('OTP');
        
        // 1. Check if phone matches any existing member
        const memberList = Object.values(members) as FamilyMember[];
        const foundMember = memberList.find(m => m.phoneNumber === phone);
        if (foundMember) {
            setMatchedMemberId(foundMember.id);
        }
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 4) return alert("Enter 4-digit OTP (Try 1234)");
    setLoading(true);

    setTimeout(() => {
        setLoading(false);
        
        if (matchedMemberId) {
            const member = members[matchedMemberId];
            if (member.joined) {
                // Scenario A: Existing User Login
                onLogin(matchedMemberId);
            } else {
                // Scenario B: Claiming an Invite
                onClaim(matchedMemberId);
            }
        } else {
            // Scenario C: New User Registration
            setStep('REGISTER');
        }
    }, 1000);
  };

  const handleRegistration = () => {
      if (!regData.name) return;
      
      const newId = `user-${Date.now()}`;
      const newMember: FamilyMember = {
          id: newId,
          name: regData.name,
          gender: regData.gender as any,
          dob: regData.dob || '1990-01-01',
          relation: RelationType.SELF,
          phoneNumber: phone,
          joined: true,
          caste: regData.caste,
          avatarUrl: `https://picsum.photos/seed/${newId}/200/200`,
          isMarried: false,
          parentIds: [],
          childrenIds: [],
          bio: 'Founder of the family tree.',
      };
      
      onRegister(newMember);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Decorative Header */}
        <div className="bg-indigo-600 h-32 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="text-center z-10 text-white">
                <h1 className="text-5xl tracking-tighter font-black">Famitry</h1>
            </div>
        </div>

        <div className="p-8 flex-1 flex flex-col">
            
            {step === 'PHONE' && (
                <div className="animate-fade-in space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
                        <p className="text-sm text-gray-500">Enter your mobile number to access your family tree.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <input 
                                type="tel" 
                                placeholder="+91 98765 43210" 
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-900"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleSendOtp}
                            disabled={loading || phone.length < 10}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            By continuing, you agree to our{' '}
                            <button 
                                onClick={() => setShowTerms(true)} 
                                className="underline hover:text-indigo-600 transition-colors focus:outline-none"
                            >
                                Terms & Privacy Policy
                            </button>.
                        </p>
                    </div>
                </div>
            )}

            {step === 'OTP' && (
                <div className="animate-fade-in space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-gray-800">Verify Identity</h2>
                        <p className="text-sm text-gray-500">Enter the code sent to {phone}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-center gap-3">
                            {[1, 2, 3, 4].map((_, i) => (
                                <input 
                                    key={i} 
                                    type="tel" 
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    className="w-14 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    value={otp[i] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Allow only numbers
                                        if (!/^\d*$/.test(val)) return;

                                        setOtp(prev => {
                                            const arr = prev.split('');
                                            arr[i] = val;
                                            return arr.join('').slice(0, 4);
                                        });
                                        // Auto-focus next (simplified)
                                        if(val && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLElement).focus();
                                    }}
                                    onKeyDown={(e) => {
                                        // Handle Backspace to move previous
                                        if (e.key === 'Backspace' && !otp[i]) {
                                             const prev = e.currentTarget.previousElementSibling as HTMLElement;
                                             if (prev) prev.focus();
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium cursor-pointer py-2">
                            <Sparkles className="w-3 h-3" /> Resend OTP
                        </div>

                        <button 
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length !== 4}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Verify & Login</>}
                        </button>
                    </div>
                </div>
            )}

            {step === 'REGISTER' && (
                <div className="animate-fade-in space-y-6">
                     <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-gray-800">Create Profile</h2>
                        <p className="text-sm text-gray-500">Start your family legacy today.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                             <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Full Name</label>
                             <input 
                                type="text"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                placeholder="e.g. Arjun Sharma"
                                value={regData.name}
                                onChange={(e) => setRegData({...regData, name: e.target.value})}
                             />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Gender</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                    value={regData.gender}
                                    onChange={(e) => setRegData({...regData, gender: e.target.value})}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Birth Year</label>
                                <input 
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                    placeholder="1990"
                                    value={regData.dob ? regData.dob.split('-')[0] : ''}
                                    onChange={(e) => setRegData({...regData, dob: `${e.target.value}-01-01`})}
                                />
                             </div>
                        </div>

                        <button 
                            onClick={handleRegistration}
                            disabled={!regData.name}
                            className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                             <UserCheck className="w-4 h-4" /> Complete Setup
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Helper Footer for Demo */}
        <div className="bg-yellow-50 p-3 text-center border-t border-yellow-100">
            <p className="text-[10px] text-yellow-800 font-medium">
                Demo Tip: Use <strong>+919876543210</strong> to login as Arjun (Existing). <br/>
                Use <strong>+910000000000</strong> for New User.
            </p>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-gray-900">Terms & Privacy Policy</h3>
                    <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-gray-600 space-y-4 leading-relaxed">
                    <section>
                        <h4 className="font-bold text-gray-900 mb-1">1. Introduction</h4>
                        <p>Welcome to Famitry. By accessing or using our application, you agree to be bound by these terms. Famitry is a private social network designed for family connections.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-gray-900 mb-1">2. Data Privacy & Security</h4>
                        <p>We prioritize your privacy. Your family tree data, personal details, and posts are shared only with users you explicitly connect with or invite to your tree. We do not sell your personal data to third-party advertisers.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-gray-900 mb-1">3. User Conduct</h4>
                        <p>You agree to use Famitry responsibly. Hate speech, harassment, or posting of inappropriate content regarding family members is strictly prohibited and may result in account suspension.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-gray-900 mb-1">4. Content Ownership</h4>
                        <p>You retain ownership of the photos and stories you post. By posting, you grant Famitry a license to display this content solely within the context of the service for you and your connections.</p>
                    </section>
                     <section>
                        <h4 className="font-bold text-gray-900 mb-1">5. Contact Us</h4>
                        <p>If you have any questions or concerns about these terms, please contact support@famitry.app.</p>
                    </section>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button 
                        onClick={() => setShowTerms(false)} 
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        I Understand & Agree
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
