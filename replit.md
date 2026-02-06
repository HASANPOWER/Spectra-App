# Spectra - Privacy-Focused Messaging App

## Overview
Spectra is a privacy-focused React Native mobile application built with Expo. It implements "Identity Sharding" - allowing users to maintain separate messaging identities for different life contexts (Family, Work, and Anonymous/Ghost mode).

## Key Features
- **Multi-Language Support**: English, Arabic (RTL), French, Turkish, Spanish
- **Identity Sharding**: 3 distinct personas with unique color themes
  - Family (Orange/Amber)
  - Work (Deep Blue/Navy)
  - Ghost (Black/Neon Green)
- **Dynamic Theming**: Entire app theme changes based on selected persona
- **App Lock Security**: PIN code (4-digit) and biometric (Face ID/Touch ID) authentication
- **Cyberpunk Aesthetic**: Dark mode by default with high-tech visual design
- **Light/Dark Mode**: Functional toggle with persona-specific color themes

## Project Architecture

### Frontend (client/)
```
client/
├── App.tsx                    # Main app entry with providers
├── context/
│   └── AppContext.tsx         # Global state (persona, language, theme)
├── i18n/
│   ├── index.ts               # i18next configuration
│   └── translations.ts        # All language translations
├── constants/
│   └── theme.ts               # Colors, spacing, persona themes
├── screens/
│   ├── AuthScreen.tsx         # Initial PIN code entry
│   ├── LockScreen.tsx         # App lock screen (PIN/Biometric)
│   ├── PersonaSelectorScreen.tsx  # Swipeable persona cards
│   ├── ChatListScreen.tsx     # Conversation list per persona
│   ├── ChatRoomScreen.tsx     # Message thread
│   └── SettingsScreen.tsx     # Language, theme & security settings
├── navigation/
│   └── RootStackNavigator.tsx # All navigation routes
└── components/                # Reusable UI components
```

### Backend (server/)
```
server/
├── index.ts                   # Express server setup
├── routes.ts                  # API endpoints
├── storage.ts                 # Data storage interface
└── templates/
    └── landing-page.html      # Static landing page
```

## Navigation Flow
1. Lock Screen (if PIN/Biometric enabled) →
2. Auth Screen (initial PIN entry) → 
3. Persona Selector (swipeable cards) → 
4. Chat List (per persona) → 
5. Chat Room (messaging)
6. Settings (accessible from Persona Selector)

## Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **State**: React Context + AsyncStorage
- **i18n**: i18next + react-i18next
- **Animations**: react-native-reanimated
- **Icons**: lucide-react-native
- **Backend**: Express.js
- **Database**: Firebase Firestore (real-time messaging)

## Firebase Integration
- Config file: `client/config/firebase.ts`
- Project: spectra-app-f6cdf
- Real-time chat via Firestore `onSnapshot`
- Messages stored in `chats/{chatId}/messages` collection
- Environment variable: `EXPO_PUBLIC_GOOGLE_API_KEY`

## Running the App
- Frontend: `npm run expo:dev` (port 8081)
- Backend: `npm run server:dev` (port 5000)

## User Preferences
- Dark mode by default (cyberpunk aesthetic)
- Language persisted in AsyncStorage
- RTL layout support for Arabic

## Recent Changes
- Initial MVP implementation with all core screens
- Multi-language support with 5 languages
- Identity sharding with 3 persona themes
- PIN authentication screen
- Swipeable persona selector
- Chat list and chat room screens
- Settings for language and theme switching
- Full RTL support for Arabic with I18nManager
- Burn Timer feature for self-destruct messages (10s, 1h, 24h) with auto-deletion
- Trust indicators (P2P encryption badges) in chat headers
- Modern avatar system with persona-specific Lucide icons
- Security settings section (Change PIN, Biometrics, Panic Button)
- New Connection modal from FAB button
- Chat menu with Clear History and Block User options
- Firebase Firestore integration for real-time messaging
- Unique Spectra ID per persona with copy-to-clipboard
- Dynamic chat list from Firebase with real-time updates
- Shared chat IDs using sorted participant IDs (format: @USER1_@USER2)
- Auto burn timer deletion using setTimeout and deleteDoc
