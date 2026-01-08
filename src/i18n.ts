import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import en from './locales/en';
import tr from './locales/tr';

const translations = { en, tr };

type Language = 'en' | 'tr';

interface I18nStore {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof en, params?: Record<string, string | number>) => string;
}

const getSystemLanguage = (): Language => {
    try {
        const locale = Localization.getLocales()[0]?.languageCode;
        if (locale === 'tr') return 'tr';
    } catch (e) {
        console.log('Locale check failed', e);
    }
    return 'en';
};

export const useI18nStore = create<I18nStore>()(
    persist(
        (set, get) => ({
            language: getSystemLanguage(),
            setLanguage: (lang: Language) => set({ language: lang }),
            t: (key: keyof typeof en, params?: Record<string, string | number>) => {
                const lang = get().language;
                let text = translations[lang][key] || translations['en'][key] || key;

                if (params) {
                    Object.keys(params).forEach(param => {
                        text = text.replace(`{{${param}}}`, String(params[param]));
                    });
                }
                return text;
            }
        }),
        {
            name: 'hush-i18n-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const t = (key: keyof typeof en, params?: Record<string, string | number>) => useI18nStore.getState().t(key, params);
