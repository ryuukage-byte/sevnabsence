// Authentication & Device Authorization Service for Tablet Kiosk

const STORAGE_KEYS = {
  DEVICE_INITIALIZED: 'sevn_device_initialized',
  ADMIN_EMAIL: 'sevn_admin_email',
  ADMIN_PASSWORD: 'sevn_admin_password', // In production, stored as hashed / managed via Supabase Auth
  ADMIN_PIN: 'sevn_admin_pin',
  ADMIN_SESSION_ACTIVE: 'sevn_admin_session_unlocked'
};

const DEFAULT_ADMIN = {
  email: 'admin@abccare.com',
  password: 'admin123',
  pin: '1234'
};

class AuthService {
  private isDeviceInitialized: boolean;
  private isAdminUnlocked: boolean = false;
  private adminEmail: string;
  private adminPass: string;
  private adminPin: string;

  constructor() {
    this.isDeviceInitialized = localStorage.getItem(STORAGE_KEYS.DEVICE_INITIALIZED) === 'true';
    this.adminEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || DEFAULT_ADMIN.email;
    this.adminPass = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN.password;
    this.adminPin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_ADMIN.pin;
  }

  // 1. Initial Device Setup & Master Admin Login
  isInitialized(): boolean {
    return this.isDeviceInitialized;
  }

  initialAdminLogin(email: string, pass: string): { success: boolean; message: string } {
    // Validate credentials (or compare against default credentials)
    if (email.trim() && pass.trim()) {
      this.adminEmail = email.trim();
      this.adminPass = pass;
      this.isDeviceInitialized = true;
      this.isAdminUnlocked = false; // Start in locked kiosk mode after setup

      localStorage.setItem(STORAGE_KEYS.DEVICE_INITIALIZED, 'true');
      localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, this.adminEmail);
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, this.adminPass);

      return { success: true, message: 'Perangkat berhasil diotorisasi!' };
    }
    return { success: false, message: 'Email dan password tidak boleh kosong.' };
  }

  // 2. Admin Mode Gate (Check Password / PIN when clicking Admin Mode)
  isUnlocked(): boolean {
    return this.isAdminUnlocked;
  }

  unlockAdmin(inputPasswordOrPin: string): boolean {
    const clean = inputPasswordOrPin.trim();
    if (clean === this.adminPass || clean === this.adminPin) {
      this.isAdminUnlocked = true;
      return true;
    }
    return false;
  }

  lockAdmin(): void {
    this.isAdminUnlocked = false;
  }

  // 3. Reset Device (if changing tablet branch)
  resetDevice(): void {
    localStorage.removeItem(STORAGE_KEYS.DEVICE_INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION_ACTIVE);
    this.isDeviceInitialized = false;
    this.isAdminUnlocked = false;
  }

  getAdminEmail(): string {
    return this.adminEmail;
  }
}

export const authService = new AuthService();
