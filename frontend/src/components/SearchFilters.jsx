import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function SearchFilters({ categories = [], initialFilters, onApply }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState(initialFilters.categoryId || '');
    const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
    const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
    const [isNegotiable, setIsNegotiable] = useState(initialFilters.isNegotiable);


    useEffect(() => {
        setSelectedCategoryId(initialFilters.categoryId || '');
        setMinPrice(initialFilters.minPrice || '');
        setMaxPrice(initialFilters.maxPrice || '');
        setIsNegotiable(initialFilters.isNegotiable);
    }, [initialFilters.categoryId, initialFilters.minPrice, initialFilters.maxPrice, initialFilters.isNegotiable]);


    const handleCategoryChange = (id) => {
        setSelectedCategoryId(prev => String(prev) === String(id) ? '' : String(id));
    };
    const handlePriceChange = (val, setter) => {
        const cleanVal = val.replace(/\D/g, '');
        if (cleanVal === '') {
            setter('');
            return;
        }
        const num = parseInt(cleanVal, 10);
        if (!isNaN(num)) {
            setter(num);
        }
    };

    const handleApply = () => {
        onApply({
            categoryId: selectedCategoryId || undefined,
            minPrice: minPrice !== '' ? Number(minPrice) : undefined,
            maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
            isNegotiable,
        });
    };

    const formatDisplay = (val) => {
        if (val === '' || val === undefined || val === null) return '';
        return new Intl.NumberFormat('id-ID').format(val);
    };
    const chips = useMemo(() => [
        { label: '< Rp10.000', min: '', max: 10000 },
        { label: 'Rp10.000 – Rp50.000', min: 10000, max: 50000 },
        { label: 'Rp50.000 – Rp100.000', min: 50000, max: 100000 },
        { label: '> Rp100.000', min: 100000, max: '' },
    ], []);

    const isChipActive = (chip) => {
        const currentMin = minPrice === '' ? '' : Number(minPrice);
        const currentMax = maxPrice === '' ? '' : Number(maxPrice);
        return currentMin === chip.min && currentMax === chip.max;
    };

    const handleChipClick = (chip) => {
        if (isChipActive(chip)) {
            setMinPrice('');
            setMaxPrice('');
        } else {
            setMinPrice(chip.min);
            setMaxPrice(chip.max);
        }
    };

    return (
        <aside className="w-[250px] shrink-0 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-6 self-start sticky top-8">
            {/* Filter Header */}
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-[#154212] font-extrabold text-lg leading-none">Filters</h2>
                <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1 block">
                    REFINE HARVEST
                </span>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group text-sm text-gray-700 hover:text-primary-green">
                            <input
                                type="checkbox"
                                checked={String(selectedCategoryId) === String(cat.id)}
                                onChange={() => handleCategoryChange(cat.id)}
                                className="w-4.5 h-4.5 border border-gray-300 rounded text-primary-green focus:ring-primary-green accent-primary-green"
                            />
                            <span className="font-medium text-gray-700">{cat.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rentang Harga (IDR)</h3>

                {/* Formatted Inputs */}
                <div className="flex gap-2">
                    {/* Min Price Input */}
                    <div className="flex-1 space-y-1">
                        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus-within:ring-2 focus-within:ring-primary-green focus-within:bg-white transition-all">
                            <span className="text-gray-400 font-bold mr-1 select-none">Rp</span>
                            <input
                                type="text"
                                value={formatDisplay(minPrice)}
                                onChange={(e) => handlePriceChange(e.target.value, setMinPrice)}
                                placeholder="0"
                                className="w-full bg-transparent text-left focus:outline-none text-gray-800 font-medium"
                            />
                        </div>
                    </div>

                    {/* Max Price Input */}
                    <div className="flex-1 space-y-1">
                        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus-within:ring-2 focus-within:ring-primary-green focus-within:bg-white transition-all">
                            <span className="text-gray-400 font-bold mr-1 select-none">Rp</span>
                            <input
                                type="text"
                                value={formatDisplay(maxPrice)}
                                onChange={(e) => handlePriceChange(e.target.value, setMaxPrice)}
                                placeholder="100.000"
                                className="w-full bg-transparent text-left focus:outline-none text-gray-800 font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick-range chips */}
                <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pilih Cepat</span>
                    <div className="flex flex-wrap gap-1.5">
                        {chips.map((chip, idx) => {
                            const active = isChipActive(chip);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleChipClick(chip)}
                                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold transition-all border cursor-pointer ${active
                                        ? 'bg-primary-green/10 text-primary-green border-primary-green'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                                        }`}
                                >
                                    {chip.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Negotiable Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bisa Negosiasi Harga?</h3>
                {/* Segmented control buttons */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setIsNegotiable(isNegotiable === true ? undefined : true)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${isNegotiable === true
                            ? 'bg-primary-green text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Ya
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsNegotiable(isNegotiable === false ? undefined : false)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${isNegotiable === false
                            ? 'bg-primary-green text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Tidak
                    </button>
                </div>
            </div>

            {/* Apply Button */}
            <button
                type="button"
                onClick={handleApply}
                className="w-full py-3 bg-primary-green hover:bg-primary-green-500 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
            >
                <Search size={16} />
                Tambahkan Filter
            </button>
        </aside>
    );
}
