import React, { useState } from 'react';
import { LogIn, Upload, Users, GraduationCap, Play, ClipboardList, CheckCircle2, Home } from 'lucide-react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { parseExamWord, Question } from './utils/WordParser';
import confetti from 'canvas-confetti';

export default function App() {
    const [view, setView] = useState<'home' | 'teacher' | 'student' | 'exam'>('home');
    const [user, setUser] = useState<any>(null);
    const [examData, setExamData] = useState<Question[]>([]);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentExamTitle, setCurrentExamTitle] = useState('');

    const login = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            setUser(res.user);
            setView('teacher');
        } catch (err) {
            console.error(err);
            alert("Lỗi đăng nhập! Kiểm tra Authorized Domains trong Firebase.");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            const parsed = await parseExamWord(file);
            if (parsed.length === 0) {
                alert("Không tìm thấy câu hỏi trong file Word. Hãy chắc chắn câu hỏi bắt đầu bằng 'Câu X.'");
                setLoading(false);
                return;
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await addDoc(collection(db, "rooms"), {
                code,
                title: file.name,
                questions: parsed,
                teacherId: user.uid,
                teacherName: user.displayName,
                createdAt: serverTimestamp()
            });

            setRoomCode(code);
            setCurrentExamTitle(file.name);
            alert(`Đã tạo phòng thi thành công! Mã: ${code}`);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải đề lên.");
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = () => {
        if (!roomCode) return alert("Vui lòng nhập mã phòng!");

        setLoading(true);
        const q = query(collection(db, "rooms"), where("code", "==", roomCode));
        onSnapshot(q, (snapshot) => {
            setLoading(false);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setExamData(data.questions);
                setCurrentExamTitle(data.title);
                setView('exam');
            } else {
                alert("Mã phòng không tồn tại hoặc đã bị xóa!");
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4">
            {/* Navigation */}
            <nav className="flex justify-between items-center py-6 mb-8 border-b border-white/5">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => setView('home')}
                >
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <GraduationCap size={24} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter">
                        MATH<span className="text-indigo-500">PRO</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {view !== 'home' && (
                        <button
                            onClick={() => setView('home')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <Home size={20} />
                        </button>
                    )}
                    {user ? (
                        <div className="flex items-center gap-3 glass-card pl-2 pr-4 py-1.5 rounded-full border-indigo-500/20">
                            <img src={user.photoURL} className="w-8 h-8 rounded-full border border-indigo-500/50" alt="avatar" />
                            <span className="text-sm font-semibold hidden md:block">{user.displayName}</span>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="text-sm font-bold hover:text-indigo-400 transition-colors"
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </nav>

            <main className="max-w-4xl mx-auto pb-20">
                {/* VIEW: HOME */}
                {view === 'home' && (
                    <div className="text-center py-12 md:py-20 space-y-12 animate-in fade-in duration-500">
                        <div className="space-y-6">
                            <h2 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                                Thi Toán Online <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                                    Từ File Word .docx
                                </span>
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                                Tự động nhận diện công thức LaTeX, hình vẽ và đáp án gạch chân.
                                Tạo đề thi chuyên nghiệp chỉ với một lần kéo thả.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div
                                onClick={() => setView('teacher')}
                                className="glass-card p-10 rounded-[2.5rem] cursor-pointer hover:bg-white/10 transition-all border-indigo-500/20 group hover:border-indigo-500/50"
                            >
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <ClipboardList className="text-indigo-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Dành cho Giáo viên</h3>
                                <p className="text-slate-400">Tải file Word, tạo mã phòng và quản lý kết quả thi.</p>
                            </div>

                            <div
                                onClick={() => setView('student')}
                                className="glass-card p-10 rounded-[2.5rem] cursor-pointer hover:bg-white/10 transition-all border-pink-500/20 group hover:border-pink-500/50"
                            >
                                <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Users className="text-pink-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Dành cho Học sinh</h3>
                                <p className="text-slate-400">Tham gia thi nhanh bằng mã phòng, xem lời giải chi tiết.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: TEACHER */}
                {view === 'teacher' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="glass-card p-10 rounded-[2.5rem] text-center space-y-8">
                            {!user ? (
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                                        <LogIn className="text-indigo-400" size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold">Xác thực Giáo viên</h2>
                                    <p className="text-slate-400">Vui lòng đăng nhập để có thể tải đề và tạo phòng thi.</p>
                                    <button
                                        onClick={login}
                                        className="btn-primary w-full max-w-sm mx-auto"
                                    >
                                        <LogIn size={20} /> Đăng nhập với Google
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black">Quản lý Đề thi</h2>
                                        <p className="text-slate-400">Chọn file Word (.docx) đã được gạch chân đáp án đúng.</p>
                                    </div>

                                    <div className="flex flex-col items-center gap-6">
                                        <label className={`btn-primary w-full max-w-sm cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <Upload size={20} />
                                            {loading ? 'Đang xử lý...' : 'Tải đề thi từ máy tính'}
                                            <input type="file" className="hidden" accept=".docx" onChange={handleUpload} />
                                        </label>

                                        {roomCode && (
                                            <div className="w-full max-w-md bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-3xl space-y-2 animate-in zoom-in">
                                                <p className="text-indigo-300 font-medium italic">Phòng thi đang mở:</p>
                                                <div className="text-5xl font-black tracking-widest text-white drop-shadow-md">
                                                    {roomCode}
                                                </div>
                                                <p className="text-sm text-slate-400 pt-2">Hãy gửi mã này cho học sinh để bắt đầu thi.</p>
                                                <div className="text-sm font-bold text-indigo-400 uppercase tracking-tighter pt-2 truncate leading-relaxed">
                                                    {currentExamTitle}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: STUDENT */}
                {view === 'student' && (
                    <div className="max-w-md mx-auto animate-in slide-in-from-bottom-8 duration-500">
                        <div className="glass-card p-10 rounded-[2.5rem] space-y-8 text-center shadow-indigo-500/10 shadow-2xl">
                            <div className="w-20 h-20 bg-pink-500/10 rounded-3xl flex items-center justify-center mx-auto">
                                <Play className="text-pink-400 pl-1" size={40} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black">Phòng thi Online</h2>
                                <p className="text-slate-400">Nhập mã phòng 6 chữ số từ giáo viên của bạn.</p>
                            </div>
                            <input
                                type="text"
                                maxLength={6}
                                value={roomCode}
                                placeholder="000000"
                                className="w-full bg-white/5 border border-white/20 p-6 rounded-2xl text-4xl text-center font-black tracking-[0.5em] focus:border-pink-500 outline-none transition-all placeholder:text-white/10"
                                onChange={(e) => setRoomCode(e.target.value)}
                            />
                            <button
                                onClick={joinRoom}
                                disabled={loading}
                                className="btn-primary w-full py-5 text-xl bg-gradient-to-r from-pink-600 to-rose-600"
                            >
                                {loading ? 'Đang vào...' : 'Vào Thi Ngay'}
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW: EXAM */}
                {view === 'exam' && (
                    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-700">
                        <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 sticky top-24 z-40 backdrop-blur-lg">
                            <div>
                                <h2 className="font-bold text-indigo-400 uppercase text-xs tracking-widest mb-1">Đang làm bài</h2>
                                <p className="font-bold truncate max-w-[200px] md:max-w-xs">{currentExamTitle}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">{examData.length}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Tổng câu hỏi</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {examData.map((q, i) => (
                                <div key={i} className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6">
                                    <div className="flex gap-4">
                                        <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
                                            {i + 1}
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold leading-relaxed">{q.text.replace(/^Câu\s\d+[:.]?/i, '')}</p>
                                            {q.type === 'TF' && <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Đúng / Sai</span>}
                                            {q.type === 'SHORT' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Trả lời ngắn</span>}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 pl-14">
                                        {q.type === 'SHORT' ? (
                                            <input
                                                type="text"
                                                placeholder="Nhập câu trả lời của bạn..."
                                                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                                            />
                                        ) : (
                                            q.options.map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    className="text-left p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all font-medium group flex justify-between items-center"
                                                >
                                                    <span>{opt}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-${q.type === 'TF' ? 'pink' : 'indigo'}-500 transition-colors`}></div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10">
                            <button
                                onClick={() => {
                                    confetti({
                                        particleCount: 150,
                                        spread: 70,
                                        origin: { y: 0.6 }
                                    });
                                    alert("Chúc mừng bạn đã hoàn thành bài thi!");
                                    setView('home');
                                }}
                                className="btn-primary w-full py-6 text-2xl font-black shadow-indigo-500/20 shadow-xl"
                            >
                                <CheckCircle2 size={28} /> Nộp Bài & Kết Thúc
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
