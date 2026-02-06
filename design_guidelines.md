# Spectra - Design Guidelines

## Brand Identity

**Purpose**: Privacy-focused messaging app using "Identity Sharding" - users maintain separate identities for different life contexts (Family, Work, Anonymous).

**Aesthetic Direction**: Cyberpunk/High-Tech - dark, edgy, futuristic with sharp contrasts, glowing accents, and a sense of digital security. Think encrypted communications, neon highlights, and premium tech sophistication.

**Memorable Element**: The dynamic theme-switching when selecting personas - the entire app morphs colors instantly, creating a visceral sense of identity shift.

## Navigation Architecture

**Root Navigation**: Custom Stack-Only (no tabs)

**Flow**:
1. Landing/Auth (Pin/Biometric placeholder)
2. Persona Selector (swipeable card interface)
3. Chat List (per-persona, with back to Persona Selector)
4. Chat Room (standard messaging)
5. Settings (modal, accessible from Persona Selector and Chat List)

**Right-to-Left (RTL) Support**: Mandatory for Arabic. All layouts must flip horizontally (navigation, text alignment, icons).

## Color Palettes (3 Persona Themes)

### Family Shard (Warm)
- Primary: #FF8C42 (vibrant orange)
- Primary Dark: #D97232
- Background: #1A1412
- Surface: #2D1F1A
- Text Primary: #FFFFFF
- Text Secondary: #FFD4B8
- Accent: #FFAB73

### Work Shard (Professional)
- Primary: #1E3A8A (deep navy blue)
- Primary Dark: #1E3270
- Background: #0A0E1A
- Surface: #151B2E
- Text Primary: #FFFFFF
- Text Secondary: #93A3D1
- Accent: #3B82F6

### Ghost Shard (Anonymous)
- Primary: #00FF41 (neon green)
- Primary Dark: #00CC34
- Background: #000000
- Surface: #1A1A1A
- Text Primary: #FFFFFF
- Text Secondary: #7FFF9F
- Accent: #39FF14

**Global Dark Mode**: All personas use dark backgrounds. Light mode toggle in settings affects lightness of surface colors only.

## Typography

- **Font**: System default (Roboto for Android, SF Pro for iOS) - clean and tech-appropriate
- **Headings**: Bold, 24-32px
- **Body**: Regular, 16px
- **Caption/Secondary**: Regular, 14px
- **Buttons**: SemiBold, 16px

## Screen Specifications

### 1. Landing/Auth Screen
- **Purpose**: Secure entry (Pin code or biometric prompt)
- **Layout**:
  - Header: Transparent with app logo/wordmark centered
  - Main: Centered security interface (pin dots or fingerprint icon)
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: Logo, security prompt, status text
- **Theme**: Neutral dark (Background: #0A0A0A, Primary: #FFFFFF)

### 2. Persona Selector (Home)
- **Purpose**: Choose identity context via swipeable cards
- **Layout**:
  - Header: Transparent, Settings icon (top-right)
  - Main: Horizontally scrollable cards (snap pagination)
  - Footer: Indicator dots showing current card
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: 
  - 3 persona cards (Family, Work, Ghost) with icon, title, subtitle
  - Cards have subtle glow matching persona color
  - Settings icon (Lucide: Settings)

### 3. Chat List (Per-Persona)
- **Purpose**: View conversations for selected persona
- **Layout**:
  - Header: Non-transparent, persona title (left: Back to selector, right: Search icon)
  - Main: Scrollable list of chat items
  - Floating: New chat button (bottom-right)
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: 
  - Chat list items (avatar, name, last message, timestamp)
  - Empty state if no chats
  - Floating action button with shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- **Theme**: Matches selected persona

### 4. Chat Room
- **Purpose**: Message exchange in conversation
- **Layout**:
  - Header: Non-transparent, contact name (left: Back, right: Menu icon)
  - Main: Scrollable message list (inverted)
  - Footer: Input bar with send button (fixed at bottom)
  - Top inset: Spacing.xl
  - Bottom inset: Spacing.xs (input bar handles safe area)
- **Components**: 
  - Message bubbles (sent: persona primary color, received: surface color)
  - Text input with send icon (Lucide: Send)
- **Theme**: Matches selected persona

### 5. Settings (Modal)
- **Purpose**: Language selection and theme toggle
- **Layout**:
  - Header: Non-transparent, "Settings" title (left: Close)
  - Main: Scrollable form with sections
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**: 
  - Language picker (English, العربية, Français, Türkçe, Español)
  - Dark/Light mode toggle
- **Theme**: Neutral or current persona

## Multi-Language (i18n)

**Supported Languages**: English (en), Arabic (ar), French (fr), Turkish (tr), Spanish (es)

**RTL Layout**: Arabic must flip all horizontal layouts (navigation headers, text alignment, swipe direction, message bubbles alignment).

**Key Translations Needed**:
- Persona names: "Family", "Work", "Ghost"
- Screen titles: "Messages", "Settings", "New Chat"
- Actions: "Send", "Search", "Back"
- Settings: "Language", "Dark Mode", "Light Mode"

## Visual Design

- **Icons**: Lucide-React-Native exclusively (no emojis)
- **Shadows**: Only on floating action buttons (specs above)
- **Feedback**: All touchables have press opacity (0.7)
- **Transitions**: Instant theme color updates when switching personas (no fade - sharp cut for cyberpunk feel)
- **Card Design**: Persona cards have subtle border glow using persona primary color

## Assets to Generate

1. **icon.png** - App icon with cyberpunk/tech aesthetic, abstract shards motif (used: Device home screen)
2. **splash-icon.png** - Simplified icon for launch screen (used: App launch)
3. **empty-family-chats.png** - Warm illustration, family-themed (used: Family Chat List empty state)
4. **empty-work-chats.png** - Professional illustration, work-themed (used: Work Chat List empty state)
5. **empty-ghost-chats.png** - Dark, anonymous illustration (used: Ghost Chat List empty state)
6. **family-avatar.png** - Default avatar for Family persona (used: Chat list placeholder)
7. **work-avatar.png** - Default avatar for Work persona (used: Chat list placeholder)
8. **ghost-avatar.png** - Anonymous mask avatar for Ghost persona (used: Chat list placeholder)

**Asset Style**: Sharp, geometric, neon-accented illustrations matching cyberpunk aesthetic. Avoid soft/organic shapes.