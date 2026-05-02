import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Receipt {
  id: string;
  imageUrl: string;
  vendor: string;
  amount: number;
  category: string;
  date: string;
  vatAmount: number;
  notes: string;
}

const categories = [
  'Office Supplies',
  'Travel & Transport',
  'Meals & Entertainment',
  'Software & Subscriptions',
  'Professional Services',
  'Equipment',
  'Utilities',
  'Marketing',
  'Other',
];

const mockExtractData = (): Partial<Receipt> => {
  const vendors = ['Tesco', 'Pret A Manger', 'WHSmith', 'Boots', 'Sainsbury\'s', 'Costa Coffee', 'Amazon UK', 'Argos'];
  const amount = Math.floor(Math.random() * 15000 + 500) / 100;
  const vatRate = 0.2;
  return {
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    amount,
    vatAmount: Math.round(amount * vatRate * 100) / 100,
    category: categories[Math.floor(Math.random() * categories.length)],
    date: new Date().toISOString().split('T')[0],
  };
};

function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processReceipt = useCallback((file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        const extractedData = mockExtractData();
        const newReceipt: Receipt = {
          id: crypto.randomUUID(),
          imageUrl: e.target?.result as string,
          vendor: extractedData.vendor || '',
          amount: extractedData.amount || 0,
          category: extractedData.category || 'Other',
          date: extractedData.date || new Date().toISOString().split('T')[0],
          vatAmount: extractedData.vatAmount || 0,
          notes: '',
        };
        setReceipts((prev) => [newReceipt, ...prev]);
        setIsProcessing(false);
      }, 1500);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) processReceipt(files[0]);
  }, [processReceipt]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processReceipt(files[0]);
  }, [processReceipt]);

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setEditingId(null);
  };

  const totalExpenses = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalVAT = receipts.reduce((sum, r) => sum + r.vatAmount, 0);

  const categoryTotals = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#F7F4EF] relative overflow-x-hidden">
      {/* Paper texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b-2 border-[#1B2B4B]/10 bg-[#F7F4EF]/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1B2B4B] flex items-center justify-center">
                <span className="text-[#C9A962] font-serif text-lg md:text-xl">£</span>
              </div>
              <div>
                <h1 className="font-serif text-xl md:text-2xl text-[#1B2B4B] tracking-tight">Receipt Ledger</h1>
                <p className="text-xs text-[#6B7280] tracking-widest uppercase">HMRC Ready</p>
              </div>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 md:px-4 md:py-2 bg-[#1B2B4B] text-[#F7F4EF] text-xs md:text-sm tracking-wide uppercase rounded hover:bg-[#2A3D5F] transition-colors"
            >
              {showStats ? 'Hide' : 'Summary'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 md:mb-8 overflow-hidden"
            >
              <div className="bg-[#1B2B4B] rounded-lg p-4 md:p-6 text-[#F7F4EF]">
                <h2 className="font-serif text-lg md:text-xl mb-4 md:mb-6 text-[#C9A962]">Tax Year Summary</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#C9A962]/70 mb-1">Total Expenses</p>
                    <p className="text-2xl md:text-3xl font-serif">£{totalExpenses.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#C9A962]/70 mb-1">Reclaimable VAT</p>
                    <p className="text-2xl md:text-3xl font-serif">£{totalVAT.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#C9A962]/70 mb-1">Receipts Logged</p>
                    <p className="text-2xl md:text-3xl font-serif">{receipts.length}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#C9A962]/70 mb-1">Categories Used</p>
                    <p className="text-2xl md:text-3xl font-serif">{Object.keys(categoryTotals).length}</p>
                  </div>
                </div>
                {Object.keys(categoryTotals).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#F7F4EF]/10">
                    <h3 className="text-xs uppercase tracking-widest text-[#C9A962]/70 mb-3">By Category</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, total]) => (
                          <div key={cat} className="flex justify-between items-center text-sm">
                            <span className="text-[#F7F4EF]/70">{cat}</span>
                            <span className="font-mono">£{total.toFixed(2)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 md:p-12 text-center cursor-pointer
              transition-all duration-300 ease-out
              ${dragActive
                ? 'border-[#C9A962] bg-[#C9A962]/5 scale-[1.02]'
                : 'border-[#1B2B4B]/20 hover:border-[#1B2B4B]/40 hover:bg-[#1B2B4B]/[0.02]'
              }
              ${isProcessing ? 'pointer-events-none' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isProcessing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#1B2B4B] font-serif">Analysing receipt...</p>
              </motion.div>
            ) : (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-[#1B2B4B]/5 flex items-center justify-center">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-[#1B2B4B]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-serif text-lg md:text-xl text-[#1B2B4B] mb-2">
                  {dragActive ? 'Release to upload' : 'Drop receipt here'}
                </p>
                <p className="text-sm text-[#6B7280]">or tap to browse your photos</p>
                <p className="mt-4 text-xs text-[#6B7280]/60 tracking-wide">
                  We'll extract vendor, amount & VAT automatically
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* Receipts Grid */}
        {receipts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="font-serif text-lg md:text-xl text-[#1B2B4B]">Your Receipts</h2>
              <span className="text-xs text-[#6B7280] tracking-widest uppercase">
                {receipts.length} {receipts.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {receipts.map((receipt, index) => (
                  <motion.div
                    key={receipt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-[#1B2B4B]/5">
                      {/* Receipt Image */}
                      <div className="relative aspect-[4/3] bg-[#1B2B4B]/5 overflow-hidden">
                        <img
                          src={receipt.imageUrl}
                          alt={receipt.vendor}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => setEditingId(editingId === receipt.id ? null : receipt.id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <svg className="w-4 h-4 text-[#1B2B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>

                      {/* Receipt Details */}
                      <div className="p-4">
                        {editingId === receipt.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={receipt.vendor}
                              onChange={(e) => updateReceipt(receipt.id, { vendor: e.target.value })}
                              className="w-full px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962]"
                              placeholder="Vendor name"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={receipt.amount}
                                onChange={(e) => updateReceipt(receipt.id, { amount: parseFloat(e.target.value) || 0 })}
                                className="px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962]"
                                placeholder="Amount"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={receipt.vatAmount}
                                onChange={(e) => updateReceipt(receipt.id, { vatAmount: parseFloat(e.target.value) || 0 })}
                                className="px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962]"
                                placeholder="VAT"
                              />
                            </div>
                            <input
                              type="date"
                              value={receipt.date}
                              onChange={(e) => updateReceipt(receipt.id, { date: e.target.value })}
                              className="w-full px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962]"
                            />
                            <select
                              value={receipt.category}
                              onChange={(e) => updateReceipt(receipt.id, { category: e.target.value })}
                              className="w-full px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962] bg-white"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <textarea
                              value={receipt.notes}
                              onChange={(e) => updateReceipt(receipt.id, { notes: e.target.value })}
                              className="w-full px-3 py-2 border border-[#1B2B4B]/20 rounded text-sm focus:outline-none focus:border-[#C9A962] resize-none"
                              rows={2}
                              placeholder="Notes (optional)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 py-2 bg-[#1B2B4B] text-white text-sm rounded hover:bg-[#2A3D5F] transition-colors"
                              >
                                Done
                              </button>
                              <button
                                onClick={() => deleteReceipt(receipt.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-serif text-[#1B2B4B] text-lg leading-tight">{receipt.vendor}</h3>
                              <span className="text-lg font-serif text-[#1B2B4B]">£{receipt.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                              <span className="px-2 py-0.5 bg-[#1B2B4B]/5 rounded">{receipt.category}</span>
                              <span>{new Date(receipt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            {receipt.vatAmount > 0 && (
                              <p className="mt-2 text-xs text-[#C9A962]">VAT: £{receipt.vatAmount.toFixed(2)}</p>
                            )}
                            {receipt.notes && (
                              <p className="mt-2 text-xs text-[#6B7280] italic">{receipt.notes}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {receipts.length === 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12 md:py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1B2B4B]/5 mb-6">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="font-serif text-xl md:text-2xl text-[#1B2B4B] mb-2">No receipts yet</h2>
            <p className="text-[#6B7280] max-w-md mx-auto">
              Upload your first receipt to start tracking expenses for your UK tax return.
              We'll automatically extract the important details.
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1B2B4B]/10 mt-12 md:mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <p className="text-center text-xs text-[#6B7280]/60 tracking-wide">
            Requested by @spvce7 · Built by @clonkbot
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
