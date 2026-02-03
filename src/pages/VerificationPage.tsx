import { useEffect, useRef, type ChangeEvent, type RefObject } from 'react';
import { Button } from '../components';
import { useTelegram } from '../hooks/useTelegram';
import { useAppDispatch, useAppSelector } from '../store';
import { setVerificationFile, clearVerificationFiles, submitVerification } from '../store/slices/profileSlice';

interface VerificationPageProps {
    onClose: () => void;
    onSuccess: () => void;
}

type FileType = 'passport' | 'license' | 'selfie';

interface UploadCardProps {
    title: string;
    description: string;
    type: FileType;
    inputRef: RefObject<HTMLInputElement | null>;
    preview: string | null;
    onFileChange: (type: FileType) => (e: ChangeEvent<HTMLInputElement>) => void;
}

function UploadCard({ title, description, type, inputRef, preview, onFileChange }: UploadCardProps) {
    return (
        <div
            onClick={() => inputRef.current?.click()}
            className="relative bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture={type === 'selfie' ? 'user' : 'environment'}
                onChange={onFileChange(type)}
                className="hidden"
            />

            {preview ? (
                <div className="flex items-center gap-3">
                    <img
                        src={preview}
                        alt={title}
                        className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                        <p className="font-medium text-[var(--tg-theme-text-color)]">{title}</p>
                        <p className="text-sm text-green-500 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Загружено
                        </p>
                    </div>
                    <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-[var(--tg-theme-text-color)]">{title}</p>
                        <p className="text-sm text-[var(--tg-theme-hint-color)]">{description}</p>
                    </div>
                    <svg className="w-5 h-5 text-[var(--tg-theme-button-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export function VerificationPage({ onClose, onSuccess }: VerificationPageProps) {
    const dispatch = useAppDispatch();
    const { showBackButton, hideBackButton, hapticFeedback, showAlert } = useTelegram();
    const { verificationFiles, verificationPreviews, isSubmittingVerification } = useAppSelector(
        (state) => state.profile
    );

    const passportRef = useRef<HTMLInputElement>(null);
    const licenseRef = useRef<HTMLInputElement>(null);
    const selfieRef = useRef<HTMLInputElement>(null);

    // Show back button
    useEffect(() => {
        showBackButton(onClose);
        return () => {
            hideBackButton();
            dispatch(clearVerificationFiles());
        };
    }, [onClose, showBackButton, hideBackButton, dispatch]);

    const handleFileChange = (type: FileType) => (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showAlert('Пожалуйста, загрузите изображение');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showAlert('Размер файла не должен превышать 10 МБ');
            return;
        }

        hapticFeedback('light');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            dispatch(setVerificationFile({
                type,
                file,
                preview: reader.result as string,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        const { passport, license, selfie } = verificationFiles;

        if (!passport || !license || !selfie) {
            await showAlert('Пожалуйста, загрузите все необходимые документы');
            return;
        }

        try {
            hapticFeedback('medium');
            await dispatch(submitVerification({ passport, license, selfie })).unwrap();
            hapticFeedback('success');
            await showAlert('Документы успешно отправлены на проверку!');
            onSuccess();
        } catch (err) {
            hapticFeedback('error');
            await showAlert('Не удалось отправить документы. Попробуйте позже.');
            console.error(err);
        }
    };

    const isComplete = verificationFiles.passport && verificationFiles.license && verificationFiles.selfie;

    return (
        <div className="flex flex-col min-h-full px-4 pt-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center"
                >
                    <svg className="w-6 h-6 text-[var(--tg-theme-text-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                    Верификация
                </h1>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-[var(--tg-theme-text-color)]">
                    Для аренды автомобиля необходимо пройти верификацию. Загрузите фото документов для проверки.
                </p>
            </div>

            {/* Upload Cards */}
            <div className="space-y-3 mb-6">
                <UploadCard
                    title="Паспорт"
                    description="Разворот с фото"
                    type="passport"
                    inputRef={passportRef}
                    preview={verificationPreviews.passport}
                    onFileChange={handleFileChange}
                />
                <UploadCard
                    title="Водительские права"
                    description="Передняя сторона"
                    type="license"
                    inputRef={licenseRef}
                    preview={verificationPreviews.license}
                    onFileChange={handleFileChange}
                />
                <UploadCard
                    title="Селфи"
                    description="Фото с документом в руках"
                    type="selfie"
                    inputRef={selfieRef}
                    preview={verificationPreviews.selfie}
                    onFileChange={handleFileChange}
                />
            </div>


            {/* Privacy Notice */}
            <p className="text-xs text-[var(--tg-theme-hint-color)] text-center mb-6">
                Загружая документы, вы соглашаетесь с политикой обработки персональных данных
            </p>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 safe-area-bottom">
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleSubmit}
                    loading={isSubmittingVerification}
                    disabled={!isComplete}
                >
                    Отправить на проверку
                </Button>
            </div>
        </div>
    );
}
