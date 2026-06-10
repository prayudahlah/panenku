import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const frequencyLabels = {
    daily: 'Setiap Hari',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    custom: 'Kustom',
};

function updateItem(list, index, field, value) {
    const next = [...list];
    next[index] = { ...next[index], [field]: value };
    return next;
}

export { frequencyLabels };

export default function SchedulePicker({ schedules, frequency, startDate, endDate, onSchedulesChange, onFrequencyChange }) {
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('08:00');
    const [monthDay, setMonthDay] = useState('');
    const [monthTime, setMonthTime] = useState('08:00');

    const handleDayToggle = (day) => {
        const existing = schedules.find((s) => s.deliveryDay === day);
        if (existing) {
            onSchedulesChange(schedules.filter((s) => s.deliveryDay !== day));
        } else {
            const time = schedules[0]?.deliveryTime || '08:00';
            onSchedulesChange([...schedules, { deliveryDay: day, deliveryDate: '', deliveryTime: time }]);
        }
    };

    const removeSchedule = (index) => {
        onSchedulesChange(schedules.filter((_, i) => i !== index));
    };

    const updateSchedule = (index, field, value) => {
        onSchedulesChange(updateItem(schedules, index, field, value));
    };

    const handleFrequencyChange = (freq) => {
        const defaults = {
            daily: [{ deliveryDay: '', deliveryDate: '', deliveryTime: '08:00' }],
            weekly: [],
            monthly: [],
            custom: [],
        };
        if (frequency !== freq && schedules.length > 0) {
            const same = schedules.length === defaults[freq].length &&
                schedules.every((s, i) => s.deliveryDay === defaults[freq][i]?.deliveryDay && s.deliveryDate === defaults[freq][i]?.deliveryDate);
            if (!same && !window.confirm('Mengubah frekuensi akan mereset jadwal yang sudah dipilih. Lanjutkan?')) return;
        }
        onSchedulesChange(defaults[freq]);
        onFrequencyChange(freq);
    };

    const scheduleSummary = useMemo(() => {
        if (!startDate || !endDate) return '-';
        if (frequency === 'daily') return `Setiap hari, ${schedules[0]?.deliveryTime || '-'}`;
        if (frequency === 'weekly') {
            const days = schedules.filter((s) => s.deliveryDay).map((s) => s.deliveryDay);
            if (days.length === 0) return '-';
            return `${days.join(', ')}`.trim();
        }
        if (frequency === 'monthly') {
            const dates = schedules.filter((s) => s.deliveryDate).map((s) => `Tanggal ${s.deliveryDate}`);
            if (dates.length === 0) return '-';
            return `${dates.join(', ')}`.trim();
        }
        if (frequency === 'custom') {
            const dates = schedules.filter((s) => s.deliveryDate).map((s) => s.deliveryDate);
            if (dates.length === 0) return '-';
            return `${dates.length} tanggal: ${dates.join(', ')}`;
        }
        return '-';
    }, [frequency, schedules, startDate, endDate]);

    return (
        <div>
            <p className="text-xs text-gray-400 -mt-2 mb-4">Tentukan jadwal pengiriman yang akan diulang selama durasi kontrak</p>
            <div className="mb-4">
                <label className="text-xs font-medium text-gray-600">Frekuensi</label>
                <select
                    value={frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                >
                    {Object.entries(frequencyLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {frequency === 'weekly' && (
                <div>
                    <p className="text-xs text-green-700/70 mb-2">Pilih satu atau lebih hari. Setiap hari bisa punya waktu berbeda.</p>
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Hari Pengiriman</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {dayNames.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition whitespace-nowrap ${
                                    schedules.some((s) => s.deliveryDay === day)
                                        ? 'bg-primary-green text-white border-primary-green'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    {schedules.length > 0 && (
                        <div className="space-y-1.5">
                            {schedules.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-green-50/40 rounded-lg px-3 py-2">
                                    <span className="w-8 h-8 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-bold shrink-0">
                                        {s.deliveryDay?.charAt(0)}
                                    </span>
                                    <span className="font-medium text-gray-700 min-w-[60px]">{s.deliveryDay}</span>
                                    <input
                                        type="time"
                                        value={s.deliveryTime || '08:00'}
                                        onChange={(e) => updateSchedule(i, 'deliveryTime', e.target.value)}
                                        className="ml-auto border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    />
                                    <button type="button" onClick={() => handleDayToggle(s.deliveryDay)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {frequency === 'daily' && (
                <div>
                    <p className="text-xs text-green-700/70 mb-2">Barang akan dikirim setiap hari pada waktu yang dipilih.</p>
                    <label className="text-xs font-medium text-gray-600">Waktu Pengiriman</label>
                    <input
                        type="time"
                        value={schedules[0]?.deliveryTime || ''}
                        onChange={(e) => updateSchedule(0, 'deliveryTime', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green mt-1"
                    />
                </div>
            )}

            {frequency === 'monthly' && (
                <div>
                    <p className="text-xs text-green-700/70 mb-2">Masukkan tanggal (1-31). Pengiriman setiap bulan pada tanggal ini.</p>
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Tanggal Setiap Bulan</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={monthDay}
                            onChange={(e) => setMonthDay(e.target.value)}
                            placeholder="15"
                            className="w-24 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                        <input
                            type="time"
                            value={monthTime}
                            onChange={(e) => setMonthTime(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (monthDay && !schedules.some((s) => s.deliveryDate === monthDay)) {
                                    onSchedulesChange([...schedules, { deliveryDay: '', deliveryDate: monthDay, deliveryTime: monthTime || '08:00' }]);
                                    setMonthDay('');
                                    setMonthTime('08:00');
                                }
                            }}
                            disabled={!monthDay}
                            className="px-3 py-2.5 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                        >
                            <Plus size={16} /> Tambah
                        </button>
                    </div>
                    {schedules.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {schedules.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                    <span>{s.deliveryDate}</span>
                                    <input
                                        type="time"
                                        value={s.deliveryTime || ''}
                                        onChange={(e) => updateSchedule(i, 'deliveryTime', e.target.value)}
                                        className="ml-auto border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    />
                                    <button type="button" onClick={() => removeSchedule(i)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {frequency === 'custom' && (
                <div>
                    <p className="text-xs text-green-700/70 mb-2">Pilih tanggal-tanggal spesifik. Setiap tanggal bisa punya waktu berbeda.</p>
                    <label className="text-xs font-medium text-gray-600 mb-2 block">Pilih Tanggal</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                        <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-28 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (customDate && !schedules.some((s) => s.deliveryDate === customDate)) {
                                    onSchedulesChange([...schedules, { deliveryDay: '', deliveryDate: customDate, deliveryTime: customTime || '08:00' }]);
                                    setCustomDate('');
                                    setCustomTime('08:00');
                                }
                            }}
                            disabled={!customDate}
                            className="px-3 py-2.5 text-sm bg-primary-green text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                        >
                            <Plus size={16} /> Tambah
                        </button>
                    </div>
                    {schedules.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            {schedules.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                    <span>{s.deliveryDate}</span>
                                    <input
                                        type="time"
                                        value={s.deliveryTime || ''}
                                        onChange={(e) => updateSchedule(i, 'deliveryTime', e.target.value)}
                                        className="ml-auto border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                                    />
                                    <button type="button" onClick={() => removeSchedule(i)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {scheduleSummary !== '-' && (
                <div className="mt-4 p-3 bg-green-50/50 border border-green-100 rounded-lg">
                    <p className="text-xs text-gray-500">Ringkasan jadwal:</p>
                    <p className="text-sm font-medium text-primary-green mt-0.5">{frequencyLabels[frequency]}: {scheduleSummary}</p>
                </div>
            )}
        </div>
    );
}
