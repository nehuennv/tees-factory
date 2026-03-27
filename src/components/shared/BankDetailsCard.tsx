import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Componente reutilizable para mostrar los datos de transferencia bancaria.
 * Incluye funcionalidad de copiado rápido al portapapeles.
 */
export function BankDetailsCard() {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const bankData = {
        banco: "Banco Galicia",
        titular: "TEES FACTORY S.R.L.",
        cuit: "30-71458922-1",
        cbu: "0070123420000005432108",
        alias: "pago.tees.factory"
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const DetailItem = ({ label, value, field, showCopy = false }: { label: string, value: string, field: string, showCopy?: boolean }) => (
        <div className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-tight">{label}</span>
                <span className={`text-[13px] font-bold text-zinc-900 leading-tight mt-0.5`}>{value}</span>
            </div>
            {showCopy && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 transition-all bg-white shadow-sm border border-zinc-100"
                    onClick={() => copyToClipboard(value, field)}
                >
                    {copiedField === field ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                </Button>
            )}
        </div>
    );

    return (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cuenta de Transferencia</h4>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-1">
                <DetailItem label="Banco" value={bankData.banco} field="banco" />
                <DetailItem label="Titular" value={bankData.titular} field="titular" />
                <DetailItem label="CUIT" value={bankData.cuit} field="cuit" />
                <DetailItem label="CBU" value={bankData.cbu} field="cbu" showCopy />
                <DetailItem label="Alias" value={bankData.alias} field="alias" showCopy />
            </div>
        </div>
    );
}
