import { Zap, Monitor, Smartphone, MessageCircle, Briefcase, ShoppingBag, DollarSign, Shield } from 'lucide-react-native';

export type AppCategory = 'Social' | 'Productivity' | 'Finance' | 'Communication' | 'Other';

export interface VirtualApp {
    id: string;
    name: string;
    category: AppCategory;
    important: boolean; // Banking/Security
    isMuted: boolean;
    iconName: string; // We'll map this to Lucide icons
}

export const VIRTUAL_APPS: VirtualApp[] = [
    { id: 'app_1', name: 'Instagram', category: 'Social', important: false, isMuted: false, iconName: 'Smartphone' },
    { id: 'app_2', name: 'Twitter', category: 'Social', important: false, isMuted: true, iconName: 'MessageCircle' },
    { id: 'app_3', name: 'WhatsApp', category: 'Communication', important: false, isMuted: false, iconName: 'MessageCircle' },
    { id: 'app_4', name: 'Slack', category: 'Productivity', important: false, isMuted: false, iconName: 'Briefcase' },
    { id: 'app_5', name: 'Gmail', category: 'Productivity', important: false, isMuted: false, iconName: 'Monitor' },
    { id: 'app_6', name: 'Chase Bank', category: 'Finance', important: true, isMuted: false, iconName: 'DollarSign' }, // IMPORTANT
    { id: 'app_7', name: 'Google Auth', category: 'Other', important: true, isMuted: false, iconName: 'Shield' }, // IMPORTANT
    { id: 'app_8', name: 'Uber Eats', category: 'Other', important: false, isMuted: true, iconName: 'ShoppingBag' },
];
