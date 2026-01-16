import { getLocales } from 'expo-localization';

const tr = {
    // Onboarding
    onboarding_title_1: "Dijital Huzura Hoş Geldiniz",
    onboarding_desc_1: "HUSH, gürültüyü kesip gerçekten önemli olana odaklanmanızı sağlayan akıllı kalkanınızdır.",
    onboarding_title_2: "Akıllı Odak Modları",
    onboarding_desc_2: "İş, Uyku veya Kişisel zamanınız için özel profiller oluşturun.",
    onboarding_title_3: "Kontrol Sizde",
    onboarding_desc_3: "Hangi uygulamaların sizi rahatsız edebileceğini siz seçin, gerisini bize bırakın.",

    // Dashboard (FocusScreen)
    focus_modes_header: "Odak Modları",
    active_now: "Şu An Aktif",
    tap_to_stop: "Durdurmak için dokun",
    create_mode: "Yeni Mod",
    default_deep_work: "Derin İş",
    default_sleep: "Uyku",

    // Privacy
    privacy_header: "Gizlilik & Güvenlik",
    delete_all_data: "Tüm Verileri Sil",
    delete_data_confirm: "Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?",

    // AI Suggestions
    suggestion_header: "Sizin İçin Öneriler",
    apply_suggestion: "Öneriyi Uygula",

    // Common
    cancel: "İptal",
    save: "Kaydet",
    delete: "Sil",
    edit: "Düzenle",
    ok: "Tamam"
};

const en = {
    // Onboarding
    onboarding_title_1: "Welcome to Digital Peace",
    onboarding_desc_1: "HUSH is your intelligent shield to cut through the noise and focus on what matters.",
    onboarding_title_2: "Smart Focus Modes",
    onboarding_desc_2: "Create custom profiles for Work, Sleep, or Personal time.",
    onboarding_title_3: "You Are in Control",
    onboarding_desc_3: "Choose which apps can interrupt you, and let us handle the rest.",

    // Dashboard
    focus_modes_header: "Focus Modes",
    active_now: "Active Now",
    tap_to_stop: "Tap to stop",
    create_mode: "New Mode",
    default_deep_work: "Deep Work",
    default_sleep: "Sleep",

    // Privacy
    privacy_header: "Privacy & Security",
    delete_all_data: "Delete All Data",
    delete_data_confirm: "All your data will be permanently deleted. Are you sure?",

    // Suggestions
    suggestion_header: "Suggestions for You",
    apply_suggestion: "Apply Suggestion",

    // Common
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    ok: "OK"
};

const deviceLanguage = getLocales()[0]?.languageCode;
export const strings = deviceLanguage === 'tr' ? tr : en;
