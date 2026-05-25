import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Mail, KeyRound, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/apiClient';

import LogoTees from '@/assets/logo/LogoTeesFactorynegro.png';
import Bg1 from '@/assets/login/1.webp';
import Bg2 from '@/assets/login/2.webp';
import Bg3 from '@/assets/login/3.webp';

const bgImages = [Bg1, Bg2, Bg3];

type Step = 'email' | 'code' | 'password' | 'done';

const CODE_LENGTH = 6;

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [bgIndex, setBgIndex] = useState(0);
    const [step, setStep] = useState<Step>('email');
    const [isLoading, setIsLoading] = useState(false);

    // Step 1
    const [email, setEmail] = useState('');

    // Step 2
    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 3
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Background carousel
    useEffect(() => {
        const interval = setInterval(() => setBgIndex(prev => (prev + 1) % bgImages.length), 5000);
        return () => clearInterval(interval);
    }, []);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // ── Step 1: send email ────────────────────────────────────────
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiClient.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
            setStep('code');
            setResendCooldown(60);
            toast.success('Código enviado', { description: `Revisá tu bandeja: ${email}` });
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'No se pudo enviar el código.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        try {
            await apiClient.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
            setResendCooldown(60);
            toast.success('Nuevo código enviado');
        } catch {
            toast.error('No se pudo reenviar el código');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 2: verify code ───────────────────────────────────────
    const codeValue = code.join('');

    const handleCodeInput = (idx: number, val: string) => {
        const char = val.replace(/\D/g, '').slice(-1);
        const next = [...code];
        next[idx] = char;
        setCode(next);
        if (char && idx < CODE_LENGTH - 1) {
            codeRefs.current[idx + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            codeRefs.current[idx - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && idx > 0) codeRefs.current[idx - 1]?.focus();
        if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) codeRefs.current[idx + 1]?.focus();
    };

    const handleCodePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
        if (!pasted) return;
        e.preventDefault();
        const next = Array(CODE_LENGTH).fill('');
        pasted.split('').forEach((c, i) => { next[i] = c; });
        setCode(next);
        codeRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (codeValue.length < CODE_LENGTH) { toast.error('Ingresá el código completo'); return; }
        setIsLoading(true);
        try {
            await apiClient.post('/auth/verify-reset-code', {
                email: email.toLowerCase().trim(),
                code: codeValue,
            });
            setStep('password');
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'Código incorrecto o expirado.';
            toast.error(msg);
            setCode(Array(CODE_LENGTH).fill(''));
            codeRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 3: set new password ──────────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
        if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
        setIsLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                email: email.toLowerCase().trim(),
                code: codeValue,
                newPassword,
            });
            setStep('done');
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || 'No se pudo actualizar la contraseña.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">

            {/* Left: carousel + branding */}
            <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-zinc-950">
                <div className="absolute top-12 left-12 z-20">
                    <img src={LogoTees} alt="Tees Factory" className="h-10 w-auto object-contain filter invert opacity-90" />
                </div>
                <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
                    {bgImages.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === bgIndex ? 'opacity-40' : 'opacity-0'}`}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                </div>
                <div className="relative z-10 flex flex-col justify-end h-full max-w-lg mb-8">
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                        Recuperá tu acceso de forma segura.
                    </h1>
                    <p className="text-zinc-400 text-lg font-medium drop-shadow-md max-w-md">
                        Te enviamos un código al correo registrado para verificar tu identidad.
                    </p>
                </div>
            </div>

            {/* Right: form */}
            <div className="relative flex flex-col justify-center min-h-screen px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 bg-white">
                <div className="w-full max-w-[380px] mx-auto flex flex-col justify-center">

                    {/* Logo mobile */}
                    <img src={LogoTees} alt="Tees Factory" className="h-12 w-auto object-contain mb-8 md:hidden mx-auto" />

                    {/* Back to login */}
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-8 w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio de sesión
                    </button>

                    {/* ── Step 1: Email ── */}
                    {step === 'email' && (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
                                    <Mail className="w-6 h-6 text-zinc-700" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                    Olvidé mi contraseña
                                </h2>
                                <p className="text-sm text-zinc-500 mt-2">
                                    Ingresá tu correo y te enviamos un código para restablecer tu contraseña.
                                </p>
                            </div>

                            <form onSubmit={handleSendEmail} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-700 font-semibold text-sm">
                                        Correo Electrónico
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@empresa.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 placeholder:text-zinc-300"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all"
                                >
                                    {isLoading ? 'Enviando...' : 'Enviar código'}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ── Step 2: Code ── */}
                    {step === 'code' && (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
                                    <KeyRound className="w-6 h-6 text-zinc-700" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                    Ingresá el código
                                </h2>
                                <p className="text-sm text-zinc-500 mt-2">
                                    Enviamos un código de {CODE_LENGTH} dígitos a{' '}
                                    <span className="font-semibold text-zinc-700">{email}</span>.
                                    Revisá tu bandeja de entrada.
                                </p>
                            </div>

                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                {/* OTP inputs */}
                                <div className="flex gap-2 justify-between">
                                    {code.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => { codeRefs.current[idx] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleCodeInput(idx, e.target.value)}
                                            onKeyDown={e => handleCodeKeyDown(idx, e)}
                                            onPaste={handleCodePaste}
                                            className={`w-full aspect-square text-center text-xl font-black rounded-xl border-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all
                                                ${digit ? 'border-zinc-900 bg-white text-zinc-900' : 'border-zinc-200 text-zinc-400'}
                                            `}
                                            autoFocus={idx === 0}
                                        />
                                    ))}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || codeValue.length < CODE_LENGTH}
                                    className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all"
                                >
                                    {isLoading ? 'Verificando...' : 'Verificar código'}
                                </Button>

                                <p className="text-center text-sm text-zinc-500">
                                    ¿No recibiste el código?{' '}
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0 || isLoading}
                                        className={`font-bold transition-colors ${resendCooldown > 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-900 hover:underline underline-offset-2'}`}
                                    >
                                        {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar'}
                                    </button>
                                </p>
                            </form>
                        </>
                    )}

                    {/* ── Step 3: New password ── */}
                    {step === 'password' && (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
                                    <ShieldCheck className="w-6 h-6 text-zinc-700" />
                                </div>
                                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                    Nueva contraseña
                                </h2>
                                <p className="text-sm text-zinc-500 mt-2">
                                    Código verificado. Elegí una contraseña nueva de al menos 8 caracteres.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-zinc-700 font-semibold text-sm">
                                        Nueva contraseña
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showNew ? 'text' : 'password'}
                                            placeholder="Mínimo 8 caracteres"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 pr-12 placeholder:text-zinc-300"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                                            tabIndex={-1}
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-700 font-semibold text-sm">
                                        Confirmar contraseña
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Repetí la contraseña"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className={`h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 pr-12 placeholder:text-zinc-300 ${
                                                confirmPassword && confirmPassword !== newPassword ? 'border-rose-300 focus-visible:ring-rose-400' : ''
                                            }`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && confirmPassword !== newPassword && (
                                        <p className="text-xs text-rose-500 font-medium">Las contraseñas no coinciden</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                                    className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* ── Done ── */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                                    ¡Contraseña actualizada!
                                </h2>
                                <p className="text-sm text-zinc-500 mt-2">
                                    Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión con tus nuevas credenciales.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/login')}
                                className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all"
                            >
                                Ir al inicio de sesión
                            </Button>
                        </div>
                    )}

                    {/* Step indicator */}
                    {step !== 'done' && (
                        <div className="flex justify-center gap-1.5 mt-10">
                            {(['email', 'code', 'password'] as Step[]).map((s, i) => (
                                <div
                                    key={s}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        step === s ? 'w-6 bg-zinc-900' : i < ['email', 'code', 'password'].indexOf(step) ? 'w-4 bg-zinc-400' : 'w-4 bg-zinc-200'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
