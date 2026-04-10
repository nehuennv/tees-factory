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

export function PaymentReportPage() {
    const [isLoading, setIsLoading] = useState(false);
    
    // Form states
    const [bank, setBank] = useState('');
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setBank('');
        setAmount('');
        setFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!file) {
            toast.error('Por favor adjunta un comprobante.');
            return;
        }

        setIsLoading(true);

        // Simulando FormData como pidió el backend/analisis
        const formData = new FormData();
        formData.append('bank', bank);
        formData.append('amount', amount);
        formData.append('method', 'transfer'); // O el que saque del select
        formData.append('receipt', file);

        // Simulate API call that receives FormData
        console.log("Simulando envío de FormData:", {
            bank: formData.get('bank'),
            amount: formData.get('amount'),
            file: formData.get('receipt')
        });

        setTimeout(() => {
            setIsLoading(false);
            toast.success('Pago reportado con éxito. El tesorero lo validará pronto.');
            resetForm();
        }, 2000);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50/50 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 pb-20">
                
                <div className="flex flex-col gap-1 px-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Validar Transferencia</h2>
                    <p className="text-sm text-zinc-500">
                        Informa tus pagos mediante este formulario seguro. Nuestro equipo lo verificará en minutos para habilitar el despacho de tus pedidos.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Left Column: Bank Details (takes full width on mobile, 1/3 on desktop) */}
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

                    {/* Right Column: Form (takes full width on mobile, 2/3 on desktop) */}
                    <Card className="w-full md:w-2/3 border border-zinc-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <div className="p-6 md:p-8 flex flex-col gap-8">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="method" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Método de Pago</label>
                                        <Select name="method" defaultValue="transfer">
                                            <SelectTrigger id="method" className="rounded-xl h-11 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                                                <SelectValue placeholder="Seleccionar método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                                                <SelectItem value="deposit">Depósito por Cajero</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="amount" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Monto Depositado</label>
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
                                                className="rounded-xl pl-8 h-12 border-zinc-200 bg-zinc-50 focus:bg-white font-black text-lg transition-colors placeholder:font-normal placeholder:text-zinc-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="bank" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Entidad Bancaria / Billetera</label>
                                        <Input
                                            id="bank"
                                            name="bank"
                                            type="text"
                                            placeholder="Ej: Santander, MercadoPago, Galicia"
                                            value={bank}
                                            onChange={(e) => setBank(e.target.value)}
                                            required
                                            className="rounded-xl h-11 border-zinc-200 bg-zinc-50 focus:bg-white transition-colors placeholder:text-zinc-400"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Adjuntar Comprobante</label>
                                        
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
