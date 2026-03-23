export interface PasswordCheck {
  id: string;
  userId: string;
  passwordHash: string;
  salt: string;
  strength: "Weak" | "Medium" | "Strong";
  score: number;
  timestamp: number;
  metadata: {
    length: number;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: number;
}
