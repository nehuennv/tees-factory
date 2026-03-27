import { useState } from 'react';
import { BankDetailsCard } from '@/components/shared/BankDetailsCard';
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
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentReportModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [bank, setBank] = useState('');
    const [amount, setAmount] = useState('');

    const resetForm = () => {
        setBank('');
        setAmount('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Pago reportado con éxito. En revisión.');
            setIsOpen(false);
            resetForm();
        }, 2000);
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
                    onClick={() => setIsOpen(true)}
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
                        {/* --- NEW: Bank Details Card Integration --- */}
                        <BankDetailsCard />

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="method" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Método de Pago</label>
                                    <Select name="method" defaultValue="transfer">
                                        <SelectTrigger id="method" className="rounded-xl h-11 border-zinc-200">
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                                            <SelectItem value="deposit">Depósito</SelectItem>
                                            <SelectItem value="cash">Efectivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="amount" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Monto Pagado</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                            className="rounded-xl pl-8 h-11 border-zinc-200 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="bank" className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Banco / Origen</label>
                                    <Input
                                        id="bank"
                                        name="bank"
                                        type="text"
                                        placeholder="Desde qué banco transferiste"
                                        value={bank}
                                        onChange={(e) => setBank(e.target.value)}
                                        required
                                        className="rounded-xl h-11 border-zinc-200"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Adjuntar Comprobante</label>
                                    <div className="border-dashed border-2 border-zinc-200 bg-zinc-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100/50 transition-all group">
                                        <div className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center mb-2 text-zinc-400 bg-white shadow-sm group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-900 mb-0.5">
                                            Subir imagen o PDF
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium px-4 leading-tight">
                                            Se debe ver el Nro. de operación
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
                    <div className="flex flex-col gap-3">
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
                </div>
            </SheetContent>
        </Sheet>
    );
}
