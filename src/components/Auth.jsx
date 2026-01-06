import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Auth() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            toast.error(error.message || 'Lỗi kết nối Google');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="max-w-md w-full relative group">
                {/* Hiệu ứng ánh sáng nền */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-blue-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative glass-effect rounded-[3rem] p-10 md:p-14 border border-white/10 shadow-2xl bg-white/5 text-center">
                    <div className="mb-10">
                        <div className="text-6xl mb-6 animate-bounce-slow">🚀</div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                            Vocab<span className="text-primary-500">Master</span>
                        </h1>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            Chinh phục tiếng Anh thông minh hơn <br />với đồng bộ hóa đám mây
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-black/20 disabled:opacity-70 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span>Tiếp tục với Google</span>
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-4 leading-loose">
                            Bằng cách đăng nhập, bạn đồng ý với các điều khoản bảo mật của hệ thống
                        </p>
                    </div>

                    {/* Footer decoration */}
                    <div className="mt-12 flex justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500/20"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500/20"></div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
            `}} />
        </div>
    );
}
