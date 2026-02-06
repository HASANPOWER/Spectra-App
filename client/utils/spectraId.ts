import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

const SPECTRA_IDS_KEY = "@spectra_ids";
const USER_REGISTERED_KEY = "@user_registered";

function generateRandomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `@${part1}-${part2}`;
}

export interface SpectraIds {
  family: string;
  work: string;
  ghost: string;
}

export async function registerUserInFirestore(ids: SpectraIds): Promise<void> {
  try {
    const alreadyRegistered = await AsyncStorage.getItem(USER_REGISTERED_KEY);
    if (alreadyRegistered === "true") {
      return;
    }

    for (const [persona, spectraId] of Object.entries(ids)) {
      const userDocRef = doc(db, "users", spectraId);
      const existingDoc = await getDoc(userDocRef);
      
      if (!existingDoc.exists()) {
        await setDoc(userDocRef, {
          spectraID: spectraId,
          persona: persona,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await AsyncStorage.setItem(USER_REGISTERED_KEY, "true");
    console.log("User registered in Firestore successfully");
  } catch (error) {
    console.error("Error registering user in Firestore:", error);
  }
}

export async function getSpectraIds(): Promise<SpectraIds> {
  let ids: SpectraIds | null = null;
  
  try {
    const stored = await AsyncStorage.getItem(SPECTRA_IDS_KEY);
    if (stored) {
      ids = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading Spectra IDs:", error);
  }

  if (!ids) {
    ids = {
      family: generateRandomId(),
      work: generateRandomId(),
      ghost: generateRandomId(),
    };

    while (ids.work === ids.family) {
      ids.work = generateRandomId();
    }
    while (ids.ghost === ids.family || ids.ghost === ids.work) {
      ids.ghost = generateRandomId();
    }

    try {
      await AsyncStorage.setItem(SPECTRA_IDS_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Error saving Spectra IDs:", error);
    }
  }

  registerUserInFirestore(ids);

  return ids;
}
