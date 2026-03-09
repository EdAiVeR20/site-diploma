/**
 * TelegramGate — shown when the app is opened outside of Telegram.
 * Premium design matching the project's visual language.
 */
export function TelegramGate() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] z-[200] p-6">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content card */}
            <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
                {/* Logo / Icon */}
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-scale-in">
                    <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-4.653c0-.247-.04-.49-.12-.72l-1.612-4.838A1.125 1.125 0 0018.375 6h-2.25m0 0H14.25m0 0h-3.375a1.125 1.125 0 00-1.093.867L8.625 11.25m0 0h6.75" />
                    </svg>
                </div>

                {/* Title */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        GoShare
                    </h1>
                    <p className="text-blue-200/70 text-sm font-medium tracking-wide uppercase">
                        Каршеринг нового поколения
                    </p>
                </div>

                {/* Glass card */}
                <div className="w-full rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl">
                    <div className="flex items-start gap-4">
                        {/* Telegram icon */}
                        <div className="w-12 h-12 rounded-xl bg-[#2AABEE]/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-7 h-7 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-white text-base font-semibold mb-1">
                                Откройте через Telegram
                            </h2>
                            <p className="text-blue-200/60 text-sm leading-relaxed">
                                Для доступа к сервису используйте наше мини-приложение в Telegram. Нажмите на кнопку ниже.
                            </p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <a
                        href="https://t.me/goshare_diploma_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
                                   bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white font-semibold text-sm
                                   shadow-lg shadow-[#2AABEE]/30
                                   hover:shadow-xl hover:shadow-[#2AABEE]/40 hover:scale-[1.02]
                                   active:scale-95 transition-all duration-200"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Открыть в Telegram
                    </a>
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-2 text-blue-200/40 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Безопасный вход через Telegram
                </div>
            </div>
        </div>
    );
}
