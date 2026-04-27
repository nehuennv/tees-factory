import { useState, useRef } from 'react';
import { BankDetailsCard } from '@/components/shared/BankDetailsCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

export function PaymentReportPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [method, setMethod] = useState('TRANSFER');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [operationNumber, setOperationNumber] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setMethod('TRANSFER');
        setAmount('');
        setDate('');
        setOperationNumber('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    const MAX_SIZE_MB = 10;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (!ALLOWED_TYPES.includes(selected.type)) {
            toast.error('Solo se permiten archivos JPG, PNG o PDF.');
            e.target.value = '';
            return;
        }
        if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`El archivo no puede superar los ${MAX_SIZE_MB} MB.`);
            e.target.value = '';
            return;
        }
        setFile(selected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Ingresá un monto válido.');
            return;
        }
        if (!date) {
            toast.error('La fecha del pago es obligatoria.');
            return;
        }
        if (!operationNumber.trim()) {
            toast.error('El número de operación es obligatorio.');
            return;
        }
        if (!file) {
            toast.error('El comprobante de pago es obligatorio.');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();

            formData.append('amount', amount);
            formData.append('method', method);
            formData.append('reference', operationNumber);

            if (user?.reference_id) {
                formData.append('client_id', user.reference_id);
            }

            if (file) {
                formData.append('receipt', file);
            }

            // No manual Content-Type — axios sets multipart/form-data with the correct boundary automatically
            await apiClient.post('/payments', formData);

            toast.success('Pago reportado con éxito. El tesorero lo validará pronto.');
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al reportar el pago. Intentá de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50/50 p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-10">

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Left Column: Bank Details */}
                    <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-4 sticky top-6">
                        <BankDetailsCard />

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-sm tracking-tight">Proceso Seguro</span>
                                <span className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                                    Asegúrate de que el número de operación sea visible en el comprobante.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <Card className="w-full md:w-2/3 border border-zinc-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <div className="p-6 md:p-8 flex flex-col gap-6">

                                {/* Método de Pago */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="method" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                        Método de Pago
                                    </label>
                                    <Select name="method" value={method} onValueChange={setMethod}>
                                        <SelectTrigger id="method" className="rounded-xl h-11 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TRANSFER">Transferencia Bancaria</SelectItem>
                                            <SelectItem value="CASH">Depósito por Cajero</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Fecha del pago */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="date" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                        Fecha del Pago <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="rounded-xl h-11 border-zinc-200 bg-zinc-50 focus:bg-white transition-colors"
                                    />
                                </div>

                                {/* Número de operación */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="operationNumber" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                        Número de Operación <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="operationNumber"
                                        name="operationNumber"
                                        type="text"
                                        placeholder="Ej: 0012345678"
                                        value={operationNumber}
                                        onChange={(e) => setOperationNumber(e.target.value)}
                                        required
                                        className="rounded-xl h-11 border-zinc-200 bg-zinc-50 focus:bg-white transition-colors placeholder:text-zinc-400 font-mono"
                                    />
                                </div>

                                {/* Monto */}
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="amount" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                        Monto Depositado <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                            min="0.01"
                                            step="0.01"
                                            className="rounded-xl pl-8 h-12 border-zinc-200 bg-zinc-50 focus:bg-white font-black text-lg transition-colors placeholder:font-normal placeholder:text-zinc-300"
                                        />
                                    </div>
                                </div>

                                {/* Comprobante */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                        Adjuntar Comprobante <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                    />

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-dashed border-2 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                                            file ? 'border-zinc-900 bg-zinc-50/80 shadow-sm' : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 shadow-sm transition-transform ${
                                            file ? 'border-zinc-300 bg-white text-zinc-900 scale-105' : 'border-zinc-200 bg-white text-zinc-400 group-hover:scale-110'
                                        }`}>
                                            {file ? <CheckCircle2 className="w-5 h-5 text-zinc-900" /> : <UploadCloud className="w-5 h-5" />}
                                        </div>

                                        <span className="text-sm font-bold text-zinc-900 mb-1">
                                            {file ? file.name : 'Subir imagen o PDF bancario'}
                                        </span>

                                        <span className="text-[11px] text-zinc-500 font-medium px-4 leading-tight">
                                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Click para cambiar` : 'PNG, JPG o PDF de hasta 5MB.'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Form Footer Action */}
                            <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50/30">
                                <Button
                                    type="submit"
                                    className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white h-14 text-[15px] font-black tracking-wide shadow-md shadow-zinc-200/50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Subiendo a Tesorería...
                                        </>
                                    ) : (
                                        'Enviar Pago a Revisión'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
