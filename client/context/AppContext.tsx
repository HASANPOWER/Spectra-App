import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { I18nManager, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { reloadAppAsync } from "expo";
import i18n from "@/i18n";
import { rtlLanguages } from "@/i18n/translations";
import { PersonaType, PersonaColorsDark, PersonaColorsLight } from "@/constants/theme";

interface AppContextType {
  currentPersona: PersonaType;
  setCurrentPersona: (persona: PersonaType) => void;
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isRTL: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  personaTheme: typeof PersonaColorsDark.neutral;
  spectraID: string | null;
  setSpectraID: (id: string) => void;
  isPinEnabled: boolean;
  setIsPinEnabled: (enabled: boolean) => Promise<void>;
  isBiometricEnabled: boolean;
  setIsBiometricEnabled: (enabled: boolean) => Promise<void>;
  storedPin: string | null;
  setStoredPin: (pin: string) => Promise<void>;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  isSecurityLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: "@spectra_language",
  DARK_MODE: "@spectra_dark_mode",
  AUTHENTICATED: "@spectra_authenticated",
  SPECTRA_ID: "@spectra_id",
  PIN_ENABLED: "@spectra_pin_enabled",
  BIOMETRIC_ENABLED: "@spectra_biometric_enabled",
};

const SECURE_KEYS = {
  PIN_CODE: "spectra_pin_code",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPersona, setCurrentPersona] = useState<PersonaType>("neutral");
  const [language, setLanguageState] = useState("en");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [spectraID, setSpectraIDState] = useState<string | null>(null);
  const [isPinEnabled, setIsPinEnabledState] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState(false);
  const [storedPin, setStoredPinState] = useState<string | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isSecurityLoaded, setIsSecurityLoaded] = useState(false);

  const isRTL = rtlLanguages.includes(language);
  const personaTheme = isDarkMode 
    ? PersonaColorsDark[currentPersona] 
    : PersonaColorsLight[currentPersona];

  const setSpectraID = async (id: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SPECTRA_ID, id);
      setSpectraIDState(id);
    } catch (error) {
      console.error("Error saving spectraID:", error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedLanguage, savedDarkMode, savedSpectraID, savedPinEnabled, savedBiometricEnabled] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.SPECTRA_ID),
        AsyncStorage.getItem(STORAGE_KEYS.PIN_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED),
      ]);

      if (savedLanguage) {
        setLanguageState(savedLanguage);
        i18n.changeLanguage(savedLanguage);
        const shouldBeRTL = rtlLanguages.includes(savedLanguage);
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
        }
      }

      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode === "true");
      }

      if (savedSpectraID) {
        setSpectraIDState(savedSpectraID);
      }

      const pinEnabled = savedPinEnabled === "true";
      const biometricEnabled = savedBiometricEnabled === "true";
      setIsPinEnabledState(pinEnabled);
      setIsBiometricEnabledState(biometricEnabled);

      if (Platform.OS !== "web") {
        try {
          const savedPin = await SecureStore.getItemAsync(SECURE_KEYS.PIN_CODE);
          setStoredPinState(savedPin);
        } catch (e) {
          console.log("Could not load PIN from secure store");
        }
      }

      if (pinEnabled || biometricEnabled) {
        setIsAppLocked(true);
      } else {
        setIsAppLocked(false);
      }

      setIsSecurityLoaded(true);
      setIsReady(true);
    } catch (error) {
      console.error("Error loading settings:", error);
      setIsSecurityLoaded(true);
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      
      const shouldBeRTL = rtlLanguages.includes(lang);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        
        if (Platform.OS !== "web" && isReady) {
          try {
            await reloadAppAsync();
          } catch (e) {
            console.log("Could not reload for RTL change");
          }
        }
      }
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const handleSetDarkMode = async (dark: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(dark));
      setIsDarkMode(dark);
    } catch (error) {
      console.error("Error saving dark mode:", error);
    }
  };

  const setIsPinEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_ENABLED, String(enabled));
      setIsPinEnabledState(enabled);
    } catch (error) {
      console.error("Error saving PIN enabled:", error);
    }
  };

  const setIsBiometricEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, String(enabled));
      setIsBiometricEnabledState(enabled);
    } catch (error) {
      console.error("Error saving biometric enabled:", error);
    }
  };

  const setStoredPin = async (pin: string) => {
    try {
      if (Platform.OS !== "web") {
        await SecureStore.setItemAsync(SECURE_KEYS.PIN_CODE, pin);
      }
      setStoredPinState(pin);
    } catch (error) {
      console.error("Error saving PIN:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPersona,
        setCurrentPersona,
        language,
        setLanguage,
        isDarkMode,
        setIsDarkMode: handleSetDarkMode,
        isRTL,
        isAuthenticated,
        setIsAuthenticated,
        personaTheme,
        spectraID,
        setSpectraID,
        isPinEnabled,
        setIsPinEnabled,
        isBiometricEnabled,
        setIsBiometricEnabled,
        storedPin,
        setStoredPin,
        isAppLocked,
        setIsAppLocked,
        isSecurityLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
