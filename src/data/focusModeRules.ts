/**
 * Focus Mode Rules with Category-Based Blocking
 * 
 * Each Focus Mode stores categories to block/allow, not raw app lists.
 * When a new app is installed, it gets categorized and automatically
 * included in active Focus Mode rules.
 */

// App Categories
export type AppCategory =
    | 'Social'
    | 'Entertainment'
    | 'Games'
    | 'Productivity'
    | 'Communication'
    | 'Education'
    | 'Finance'
    | 'Shopping'
    | 'News'
    | 'System'
    | 'Utility'
    | 'Health'
    | 'Travel'
    | 'Other';

// Package name to Category mapping (pattern-based)
const CATEGORY_PATTERNS: Record<AppCategory, string[]> = {
    Social: [
        'com.instagram.android',
        'com.zhiliaoapp.musically', // TikTok
        'com.ss.android.ugc.trill', // TikTok
        'com.twitter.android',
        'com.snapchat.android',
        'com.facebook.katana',
        'com.facebook.orca', // Messenger
        'com.reddit.frontpage',
        'com.pinterest',
        'com.linkedin.android',
        'com.tumblr',
        'org.telegram.messenger',
        'com.discord',
        'com.bereal.ft',
        'com.threads.instagram',
        'instagram',
        'tiktok',
        'twitter',
        'snapchat',
        'facebook',
        'reddit',
        'pinterest',
        'linkedin',
        'telegram',
        'discord',
    ],

    Entertainment: [
        'com.google.android.youtube',
        'com.netflix.mediaclient',
        'com.amazon.avod.thirdpartyclient',
        'com.disney.disneyplus',
        'com.hbo.hbonow',
        'com.spotify.music',
        'com.apple.android.music',
        'com.google.android.apps.youtube.music',
        'com.deezer.android.app',
        'com.soundcloud.android',
        'tv.twitch.android.app',
        'com.crunchyroll.crunchyroid',
        'com.plexapp.android',
        'youtube',
        'netflix',
        'spotify',
        'twitch',
        'hulu',
        'disneyplus',
        'amazon.video',
        'primevideo',
    ],

    Games: [
        'com.supercell.clashofclans',
        'com.supercell.brawlstars',
        'com.supercell.clashroyale',
        'com.king.candycrushsaga',
        'com.activision.callofduty',
        'com.pubg.imobile',
        'com.mobile.legends',
        'com.riotgames.league.wildrift',
        'com.epicgames.fortnite',
        'com.miHoYo.GenshinImpact',
        'games',
        'game',
        'supercell',
        'gameloft',
        'zynga',
        'king.',
        'rovio',
    ],

    Productivity: [
        'com.google.android.gm',
        'com.microsoft.office.outlook',
        'com.google.android.apps.docs',
        'com.microsoft.office.word',
        'com.microsoft.office.excel',
        'com.microsoft.office.powerpoint',
        'com.google.android.calendar',
        'com.samsung.android.calendar',
        'com.google.android.keep',
        'com.evernote',
        'com.notion.id',
        'com.todoist',
        'com.asana.app',
        'com.atlassian.android.jira',
        'com.trello',
        'gmail',
        'outlook',
        'calendar',
        'docs',
        'sheets',
        'slides',
        'notion',
        'todoist',
        'evernote',
        'notes',
    ],

    Communication: [
        'com.whatsapp',
        'com.whatsapp.w4b',
        'com.google.android.apps.messaging',
        'com.samsung.android.messaging',
        'com.android.mms',
        'com.google.android.apps.meetings',
        'us.zoom.videomeetings',
        'com.microsoft.teams',
        'com.slack',
        'com.Slack',
        'whatsapp',
        'messaging',
        'slack',
        'teams',
        'zoom',
        'meet',
        'viber',
        'skype',
    ],

    Education: [
        'com.duolingo',
        'com.coursera.app',
        'com.udemy.android',
        'com.linkedin.android.learning',
        'com.khan.android',
        'com.quizlet.quizletandroid',
        'com.google.android.apps.classroom',
        'com.photomath.camera',
        'com.wolframalpha.android',
        'duolingo',
        'coursera',
        'udemy',
        'khan',
        'classroom',
        'learning',
        'education',
        'study',
    ],

    Finance: [
        'bank',
        'pay',
        'wallet',
        'finance',
        'money',
        'credit',
        'invest',
        'stock',
        'crypto',
        'binance',
        'revolut',
        'paypal',
        'venmo',
        'zelle',
    ],

    Shopping: [
        'com.amazon.mShop',
        'com.ebay.mobile',
        'com.alibaba.aliexpresshd',
        'amazon',
        'ebay',
        'aliexpress',
        'shopping',
        'shop',
        'store',
        'marketplace',
    ],

    News: [
        'com.google.android.apps.magazines',
        'flipboard',
        'news',
        'bbc',
        'cnn',
        'nyt',
        'guardian',
        'reuters',
    ],

    System: [
        'com.google.android.dialer',
        'com.samsung.android.dialer',
        'com.android.phone',
        'com.google.android.deskclock',
        'com.samsung.android.app.clockpack',
        'com.android.deskclock',
        'com.google.android.calculator',
        'com.google.android.contacts',
        'com.samsung.android.contacts',
        'dialer',
        'phone',
        'alarm',
        'clock',
        'calculator',
        'contacts',
        'settings',
    ],

    Utility: [
        'com.android.chrome',
        'com.google.android.apps.chrome',
        'com.google.android.apps.photos',
        'com.google.android.apps.maps',
        'com.waze',
        'chrome',
        'firefox',
        'browser',
        'photos',
        'gallery',
        'maps',
        'waze',
        'weather',
        'flashlight',
        'files',
    ],

    Health: [
        'com.google.android.apps.fitness',
        'fitbit',
        'myfitnesspal',
        'health',
        'fitness',
        'workout',
        'meditation',
        'calm',
        'headspace',
    ],

    Travel: [
        'uber',
        'lyft',
        'airbnb',
        'booking',
        'expedia',
        'kayak',
        'travel',
        'airline',
        'flight',
        'hotel',
    ],

    Other: [],
};

/**
 * Categorize an app based on its package name
 */
export function categorizeApp(packageName: string, appName?: string): AppCategory {
    const searchText = `${packageName} ${appName || ''}`.toLowerCase();

    // Check each category's patterns
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
        if (category === 'Other') continue;

        for (const pattern of patterns) {
            if (searchText.includes(pattern.toLowerCase())) {
                return category as AppCategory;
            }
        }
    }

    return 'Other';
}

/**
 * Focus Mode Rule Definition
 */
export interface FocusModeRule {
    id: string;
    name: string;
    description: string;
    icon: string;
    // Categories to block (or "ALL" for everything)
    blockedCategories: AppCategory[] | 'ALL';
    // Categories that are always allowed (overrides blockedCategories)
    allowedCategories: AppCategory[];
    // Manual user overrides
    blockedApps: string[]; // Package names to always block
    allowedApps: string[]; // Package names to always allow
    // Metadata
    isDefault: boolean;
    isCustom: boolean;
}

/**
 * Default Focus Mode Rules
 */
export const DEFAULT_FOCUS_MODE_RULES: FocusModeRule[] = [
    {
        id: 'study',
        name: 'Study',
        description: 'Focus on learning',
        icon: 'BookOpen',
        blockedCategories: ['Social', 'Entertainment', 'Games', 'News', 'Shopping'],
        allowedCategories: ['Education', 'Productivity', 'System', 'Utility'],
        blockedApps: [],
        allowedApps: [],
        isDefault: true,
        isCustom: false,
    },
    {
        id: 'work',
        name: 'Work',
        description: 'Productivity only',
        icon: 'Briefcase',
        blockedCategories: ['Social', 'Entertainment', 'Games', 'Shopping'],
        allowedCategories: ['Productivity', 'Communication', 'System', 'Utility'],
        blockedApps: [],
        allowedApps: [],
        isDefault: true,
        isCustom: false,
    },
    {
        id: 'sleep',
        name: 'Sleep',
        description: 'Complete silence',
        icon: 'Moon',
        blockedCategories: 'ALL',
        allowedCategories: ['System'], // Phone and Alarm only
        blockedApps: [],
        allowedApps: [],
        isDefault: true,
        isCustom: false,
    },
    {
        id: 'deep-focus',
        name: 'Deep Focus',
        description: 'Zero distractions',
        icon: 'Zap',
        blockedCategories: 'ALL',
        allowedCategories: [], // Only Phone/Alarm via System category
        blockedApps: [],
        allowedApps: [],
        isDefault: true,
        isCustom: false,
    },
];

// Essential apps that are NEVER blocked (even in "ALL" mode)
const ESSENTIAL_APPS = [
    'com.google.android.dialer',
    'com.samsung.android.dialer',
    'com.android.phone',
    'com.google.android.deskclock',
    'com.samsung.android.app.clockpack',
    'com.android.deskclock',
];

/**
 * Compute which apps should be blocked based on Focus Mode rules
 */
export function computeBlockedApps(
    allApps: Array<{ packageName: string; appName: string; category?: AppCategory }>,
    rule: FocusModeRule,
    userOverrides: Record<string, 'allow' | 'block'>
): string[] {
    const blockedApps: string[] = [];

    // Safely get rule properties with defaults for migrated modes
    const ruleAllowedApps = rule.allowedApps || [];
    const ruleBlockedApps = rule.blockedApps || [];
    const ruleAllowedCategories = rule.allowedCategories || [];
    const ruleBlockedCategories = rule.blockedCategories || [];

    for (const app of allApps) {
        const packageName = app.packageName;
        const category = app.category || categorizeApp(packageName, app.appName);

        // Step 1: Check essential apps (never block)
        if (ESSENTIAL_APPS.some(e => packageName.includes(e) || e.includes(packageName))) {
            continue;
        }

        // Step 2: Check user overrides (highest priority)
        if (userOverrides[packageName] === 'allow') {
            continue; // User explicitly allowed
        }
        if (userOverrides[packageName] === 'block') {
            blockedApps.push(packageName);
            continue;
        }

        // Step 3: Check manual rule overrides
        if (ruleAllowedApps.includes(packageName)) {
            continue; // Manually allowed in this mode
        }
        if (ruleBlockedApps.includes(packageName)) {
            blockedApps.push(packageName);
            continue;
        }

        // Step 4: Check allowed categories (overrides blocked)
        if (ruleAllowedCategories.includes(category)) {
            continue;
        }

        // Step 5: Check blocked categories
        if (ruleBlockedCategories === 'ALL') {
            blockedApps.push(packageName);
        } else if (Array.isArray(ruleBlockedCategories) && ruleBlockedCategories.includes(category)) {
            blockedApps.push(packageName);
        }
    }

    return blockedApps;
}

/**
 * Get summary of what a Focus Mode will block/allow
 */
export function getFocusModeSummary(
    allApps: Array<{ packageName: string; appName: string }>,
    rule: FocusModeRule,
    userOverrides: Record<string, 'allow' | 'block'>
): { blockedCount: number; allowedCount: number; blockedApps: string[]; allowedApps: string[] } {
    const categorizedApps = allApps.map(app => ({
        ...app,
        category: categorizeApp(app.packageName, app.appName),
    }));

    const blockedPackages = computeBlockedApps(categorizedApps, rule, userOverrides);
    const blockedSet = new Set(blockedPackages);

    const blockedAppNames = categorizedApps
        .filter(a => blockedSet.has(a.packageName))
        .map(a => a.appName);

    const allowedAppNames = categorizedApps
        .filter(a => !blockedSet.has(a.packageName))
        .map(a => a.appName);

    return {
        blockedCount: blockedAppNames.length,
        allowedCount: allowedAppNames.length,
        blockedApps: blockedAppNames,
        allowedApps: allowedAppNames,
    };
}
