import { useState, useRef } from 'react';
import { BankDetailsCard } from '@/components/shared/BankDetailsCard';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
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

export function PaymentReportModal() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [method, setMethod] = useState('Transferencia');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [operationNumber, setOperationNumber] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setMethod('Transferencia');
        setAmount('');
        setDate('');
        setOperationNumber('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.MouseEvent | React.FormEvent) => {
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

        setIsLoading(true);

        try {
            const formData = new FormData();
            
            // Múltiples versiones de las llaves
            formData.append('monto', amount);
            formData.append('amount', amount);
            formData.append('amount_reported', amount);

            formData.append('metodo_pago', method);
            formData.append('method', method);
            formData.append('payment_method', method);

            formData.append('fecha', date);
            formData.append('date', date);
            formData.append('payment_date', date);

            formData.append('referencia', operationNumber);
            formData.append('operationNumber', operationNumber);
            formData.append('operation_reference', operationNumber);

            if (user?.reference_id) {
                formData.append('client_id', user.reference_id);
                formData.append('clientId', user.reference_id);
            }

            if (file) {
                formData.append('receipt', file);
                formData.append('file', file);
            }

            await apiClient.post('/payments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Pago reportado con éxito. El tesorero lo validará pronto.');
            setIsOpen(false);
            resetForm();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al reportar el pago. Intentá de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) resetForm();
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button
                    className="w-full rounded-xl bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800 h-10 font-bold transition-all shadow-md shadow-zinc-200"
                >
                    Informar Pago Ahora
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-0 sm:max-w-md w-full bg-white p-0 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 shrink-0 bg-white">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-black tracking-tight">Reportar Pago</SheetTitle>
                        <SheetDescription className="text-zinc-500 font-medium text-xs">
                            Informa tu pago para que podamos procesar tu despacho.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 flex flex-col gap-8">
                        <BankDetailsCard />

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="modal-method" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Método de Pago</label>
                                <Select name="method" value={method} onValueChange={setMethod}>
                                    <SelectTrigger id="modal-method" className="rounded-xl h-11 border-zinc-200 bg-zinc-50">
                                        <SelectValue placeholder="Seleccionar método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                                        <SelectItem value="Deposito">Depósito por Cajero</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="modal-date" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    Fecha del Pago <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="modal-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="rounded-xl h-11 border-zinc-200 bg-zinc-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="modal-op" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    Número de Operación <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="modal-op"
                                    type="text"
                                    placeholder="Ej: 0012345678"
                                    value={operationNumber}
                                    onChange={(e) => setOperationNumber(e.target.value)}
                                    required
                                    className="rounded-xl h-11 border-zinc-200 bg-zinc-50 focus:bg-white transition-colors placeholder:text-zinc-400 font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="modal-amount" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    Monto Depositado <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                    <Input
                                        id="modal-amount"
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

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    Adjuntar Comprobante <span className="text-zinc-300 font-normal lowercase">(opcional)</span>
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-dashed border-2 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                                        file ? 'border-zinc-900 bg-zinc-50/80' : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2.5 shadow-sm transition-transform ${
                                        file ? 'border-zinc-300 bg-white text-zinc-900 scale-105' : 'border-zinc-200 bg-white text-zinc-400 group-hover:scale-110'
                                    }`}>
                                        {file ? <CheckCircle2 className="w-4 h-4 text-zinc-900" /> : <UploadCloud className="w-4 h-4" />}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-900 mb-0.5">
                                        {file ? file.name : 'Subir imagen o PDF bancario'}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-medium px-4 leading-tight">
                                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Click para cambiar` : 'El Nro. de operación debe ser visible'}
                                    </span>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
                    <Button
                        onClick={handleSubmit}
                        className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white h-12 font-bold shadow-lg shadow-zinc-200"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando reporte...
                            </>
                        ) : (
                            'Informar Pago Ahora'
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
