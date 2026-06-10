import React, { useEffect, useId, useRef, useState } from 'react';
import { masterApiFetch } from '../auth/masterApiClient';
import { getBaseDomain } from '../tenancy/tenantContext';

const MONTH_OPTIONS = [1, 3, 6, 12];
const DEFAULT_PACKAGE_PRICES = {
    1: 50000,
    3: 140000,
    6: 270000,
    12: 500000,
};
const QR_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

function normalizePackagePrices(raw) {
    const out = { ...DEFAULT_PACKAGE_PRICES };
    if (raw && typeof raw === 'object') {
        for (const months of MONTH_OPTIONS) {
            const value = raw[months] ?? raw[String(months)];
            if (value != null && !Number.isNaN(Number(value))) {
                out[months] = Number(value);
            }
        }
    }
    return out;
}

function parsePackagePrice(value) {
    if (value === '' || value == null) {
        return null;
    }
    const cleaned = String(value).replace(/[^\d]/g, '');
    if (cleaned === '') {
        return null;
    }
    const parsed = parseInt(cleaned, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

function validatePackagePrices(rawPrices) {
    /** @type {Record<number, string>} */
    const errors = {};
    /** @type {Record<number, number>} */
    const parsed = {};

    for (const months of MONTH_OPTIONS) {
        const value = parsePackagePrice(rawPrices[months]);
        if (value == null || value < 1000) {
            errors[months] = 'Mínimo $1.000 COP.';
            continue;
        }
        parsed[months] = value;
    }

    if (Object.keys(errors).length === 0) {
        if (parsed[3] < parsed[1]) {
            errors[3] = 'Debe ser al menos el precio de 1 mes.';
        }
        if (parsed[6] < parsed[3]) {
            errors[6] = 'Debe ser al menos el precio de 3 meses.';
        }
        if (parsed[12] < parsed[6]) {
            errors[12] = 'Debe ser al menos el precio de 6 meses.';
        }
    }

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        parsed,
    };
}

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-stone-100 dark:border-stone-800 last:border-0">
            <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="text-sm font-medium text-stone-900 dark:text-stone-100 sm:text-right break-all">{value}</dd>
        </div>
    );
}

function packagePriceFieldName(months) {
    if (months === 1) return 'price_1_month_cop';
    return `price_${months}_months_cop`;
}

function PackagePricingFields({ prices, errors, onChange }) {
    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium">Precios por paquete (COP)</p>
                <p className="text-xs text-stone-500 mt-1">
                    Total fijo por duración. Cada paquete debe costar más que el anterior.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MONTH_OPTIONS.map((months) => {
                    const inputId = `package-price-${months}`;
                    const parsed = parsePackagePrice(prices[months]);
                    const fieldError = errors[months];
                    return (
                        <div key={months}>
                            <label htmlFor={inputId} className="text-xs text-stone-500">
                                {months} mes{months === 1 ? '' : 'es'} — total
                            </label>
                            <input
                                id={inputId}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={prices[months] ?? ''}
                                onChange={(e) => onChange(months, e.target.value)}
                                placeholder={String(DEFAULT_PACKAGE_PRICES[months])}
                                aria-invalid={Boolean(fieldError)}
                                className={`mt-1 w-full rounded-lg border bg-white dark:bg-stone-950 px-3 py-2 text-sm tabular-nums ${
                                    fieldError
                                        ? 'border-red-400 dark:border-red-500/70'
                                        : 'border-stone-200 dark:border-stone-700'
                                }`}
                            />
                            {parsed != null && !fieldError ? (
                                <p className="mt-1 text-[11px] text-stone-500">{formatCop(parsed)}</p>
                            ) : null}
                            {fieldError ? (
                                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
                                    {fieldError}
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatCop(value) {
    if (value == null || Number.isNaN(Number(value))) {
        return '—';
    }
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function NequiQrUploadField({ existingUrl, file, onSelect, onClearNew }) {
    const inputId = useId();
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);
    const [fileError, setFileError] = useState('');

    const previewUrl = localPreview || existingUrl || null;

    useEffect(() => {
        if (!file) {
            setLocalPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setLocalPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    function validateAndSelect(nextFile) {
        if (!nextFile) {
            return;
        }

        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(nextFile.type)) {
            setFileError('Formato no válido. Usa JPG, PNG o WebP.');
            onSelect(null);
            return;
        }

        if (nextFile.size > 4 * 1024 * 1024) {
            setFileError('La imagen no puede superar 4 MB.');
            onSelect(null);
            return;
        }

        setFileError('');
        onSelect(nextFile);
    }

    function onInputChange(e) {
        validateAndSelect(e.target.files?.[0] ?? null);
        e.target.value = '';
    }

    function onDrop(e) {
        e.preventDefault();
        setDragOver(false);
        validateAndSelect(e.dataTransfer.files?.[0] ?? null);
    }

    return (
        <div className="space-y-2">
            <label htmlFor={inputId} className="block text-sm font-medium">
                Imagen QR Nequi
            </label>
            <p className="text-xs text-stone-500 dark:text-stone-400">
                Los administradores la verán al renovar. JPG, PNG o WebP, máximo 4 MB.
            </p>

            <div
                className={[
                    'rounded-xl border-2 border-dashed p-4 transition-colors',
                    dragOver
                        ? 'border-violet-500 bg-violet-50/80 dark:bg-violet-950/30'
                        : fileError
                          ? 'border-red-400/70 bg-red-50/50 dark:bg-red-950/20'
                          : file || existingUrl
                            ? 'border-violet-400/50 bg-violet-50/40 dark:bg-violet-950/20'
                            : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50',
                ].join(' ')}
                onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={onDrop}
            >
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    <div className="h-28 w-28 shrink-0 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden flex items-center justify-center">
                        {previewUrl ? (
                            <img src={previewUrl} alt="QR Nequi" className="h-full w-full object-contain p-1.5" />
                        ) : (
                            <svg className="h-10 w-10 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                                <rect x="4" y="4" width="6" height="6" rx="1" />
                                <rect x="14" y="4" width="6" height="6" rx="1" />
                                <rect x="4" y="14" width="6" height="6" rx="1" />
                                <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor" stroke="none" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1 w-full text-center sm:text-left space-y-3">
                        {file ? (
                            <>
                                <div>
                                    <p className="text-sm font-medium break-all">{file.name}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{formatFileSize(file.size)} · Nueva imagen</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
                                    >
                                        Cambiar imagen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFileError('');
                                            onClearNew();
                                        }}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        Quitar selección
                                    </button>
                                </div>
                            </>
                        ) : existingUrl ? (
                            <>
                                <p className="text-sm text-stone-700 dark:text-stone-300">
                                    QR actual guardado. Sube otra imagen para reemplazarlo.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 text-sm font-semibold"
                                >
                                    Reemplazar QR
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-stone-700 dark:text-stone-300">
                                    Arrastra el QR aquí o elígelo desde tu dispositivo
                                </p>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white px-4 py-2 text-sm font-semibold"
                                >
                                    Elegir imagen QR
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={QR_ACCEPT}
                onChange={onInputChange}
                className="sr-only"
            />

            {fileError ? (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {fileError}
                </p>
            ) : null}
        </div>
    );
}

function PackagePricingPreview({ packagePrices }) {
    const validation = validatePackagePrices(packagePrices);
    if (!validation.ok) {
        return (
            <p className="text-xs text-stone-500 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 px-4 py-3">
                Completa precios válidos para ver la vista previa que verá el admin.
            </p>
        );
    }

    const prices = validation.parsed;

    return (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-3">
                Vista previa para el admin
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MONTH_OPTIONS.map((months) => {
                    const total = prices[months];
                    const avg = total > 0 ? Math.round(total / months) : null;
                    return (
                        <div
                            key={months}
                            className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-center"
                        >
                            <p className="text-xs text-stone-500">
                                {months} mes{months === 1 ? '' : 'es'}
                            </p>
                            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mt-0.5">
                                {formatCop(total)}
                            </p>
                            {avg != null && months > 1 ? (
                                <p className="text-[10px] text-stone-400 mt-1">
                                    ~{formatCop(avg)}/mes
                                </p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function MasterSettingsPanel({ onMessage }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [platform, setPlatform] = useState(null);
    const [billing, setBilling] = useState(null);
    const [error, setError] = useState('');
    const [nequiKey, setNequiKey] = useState('');
    const [packagePrices, setPackagePrices] = useState(() =>
        Object.fromEntries(MONTH_OPTIONS.map((m) => [m, String(DEFAULT_PACKAGE_PRICES[m])])),
    );
    const [priceErrors, setPriceErrors] = useState({});
    const [qrFile, setQrFile] = useState(null);
    const [saving, setSaving] = useState(false);

    function updatePackagePrice(months, value) {
        const digits = String(value).replace(/[^\d]/g, '');
        setPackagePrices((prev) => ({
            ...prev,
            [months]: digits,
        }));
        setPriceErrors((prev) => {
            if (!prev[months]) {
                return prev;
            }
            const next = { ...prev };
            delete next[months];
            return next;
        });
    }

    function applyNormalizedPrices(raw) {
        const normalized = normalizePackagePrices(raw);
        setPackagePrices(
            Object.fromEntries(MONTH_OPTIONS.map((m) => [m, String(normalized[m])])),
        );
    }

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const [meRes, settingsRes, billingRes] = await Promise.all([
                    masterApiFetch('/api/master/auth/me'),
                    masterApiFetch('/api/master/platform/settings'),
                    masterApiFetch('/api/master/billing/settings'),
                ]);
                if (cancelled) {
                    return;
                }
                setUser(meRes?.user ?? null);
                setPlatform(settingsRes?.data ?? null);
                const bill = billingRes?.data ?? null;
                setBilling(bill);
                setNequiKey(bill?.nequi_key ?? '');
                applyNormalizedPrices(bill?.package_prices);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'No se pudieron cargar los ajustes.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    async function saveBilling(e) {
        e.preventDefault();

        const validation = validatePackagePrices(packagePrices);
        if (!validation.ok) {
            setPriceErrors(validation.errors);
            setError('Revisa los precios por paquete antes de guardar.');
            return;
        }

        setSaving(true);
        setError('');
        setPriceErrors({});
        try {
            const form = new FormData();
            form.append('nequi_key', nequiKey.trim());
            for (const months of MONTH_OPTIONS) {
                form.append(
                    packagePriceFieldName(months),
                    String(validation.parsed[months]),
                );
            }
            if (qrFile) {
                form.append('nequi_qr', qrFile);
            }

            const res = await masterApiFetch('/api/master/billing/settings', {
                method: 'POST',
                body: form,
            });
            const bill = res?.data ?? null;
            setBilling(bill);
            applyNormalizedPrices(bill?.package_prices);
            setQrFile(null);
            onMessage?.(res?.message || 'Datos de pago guardados.');
        } catch (err) {
            setError(err?.message || 'No se pudieron guardar los datos de pago.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <p className="text-sm text-stone-500">Cargando ajustes…</p>;
    }

    if (error && !platform) {
        return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
    }

    const baseDomain = platform?.base_domain || getBaseDomain();
    const masterHost = `${platform?.master_subdomain || 'master'}.${baseDomain}`;

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Cuenta Master</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Usuario con acceso a la plataforma de proveedor.
                </p>
                <dl className="mt-4">
                    <InfoRow label="Nombre" value={user?.name || '—'} />
                    <InfoRow label="Correo" value={user?.email || '—'} />
                    <InfoRow
                        label="Verificación 2FA"
                        value={user?.two_factor_enabled ? 'Activa' : 'No configurada'}
                    />
                </dl>
            </section>

            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Pagos Nequi (renovaciones)</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Los administradores de restaurante verán estos datos al renovar su suscripción.
                </p>

                <form onSubmit={saveBilling} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" htmlFor="nequi-key">
                            Llave o número Nequi
                        </label>
                        <input
                            id="nequi-key"
                            type="text"
                            value={nequiKey}
                            onChange={(e) => setNequiKey(e.target.value)}
                            placeholder="Ej. 3001234567 o llave @miempresa"
                            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-2 text-sm"
                            maxLength={40}
                        />
                    </div>

                    <PackagePricingFields
                        prices={packagePrices}
                        errors={priceErrors}
                        onChange={updatePackagePrice}
                    />
                    <PackagePricingPreview packagePrices={packagePrices} />

                    <NequiQrUploadField
                        existingUrl={billing?.nequi_qr_url}
                        file={qrFile}
                        onSelect={setQrFile}
                        onClearNew={() => setQrFile(null)}
                    />

                    {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                    >
                        {saving ? 'Guardando…' : 'Guardar datos de pago'}
                    </button>
                </form>
            </section>

            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
                <h2 className="font-semibold text-lg">Plataforma</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    Valores de configuración del servidor (solo lectura). Se cambian en el `.env` del backend.
                </p>
                <dl className="mt-4">
                    <InfoRow label="Modo tenancy" value={platform?.tenancy_mode || '—'} />
                    <InfoRow label="Dominio base" value={baseDomain} />
                    <InfoRow label="Panel Master" value={masterHost} />
                    <InfoRow label="Prefijo BD tenant" value={platform?.database_prefix || 'rest_'} />
                    <InfoRow
                        label="Licencia inicial (onboarding)"
                        value={
                            platform?.default_license_months
                                ? `${platform.default_license_months} mes(es)`
                                : 'Sin vencimiento'
                        }
                    />
                    <InfoRow
                        label="Enlace onboarding (TTL)"
                        value={`${platform?.onboarding_ttl_hours ?? 72} horas`}
                    />
                </dl>
            </section>
        </div>
    );
}
