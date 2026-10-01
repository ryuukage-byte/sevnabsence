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

  // 2. Sign In with registered admin credentials or master fallback
  signInAdmin(emailOrUsername: string, pass: string): { success: boolean; message: string } {
    const cleanUser = emailOrUsername.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Email/Username dan kata sandi tidak boleh kosong.' };
    }

    const savedEmail = (this.adminEmail || '').toLowerCase();
    const savedUsername = savedEmail.split('@')[0];

    const isMatch =
      (cleanUser === savedEmail ||
        cleanUser === savedUsername ||
        cleanUser === 'admin' ||
        cleanUser === 'admin123') &&
      (cleanPass === this.adminPass || cleanPass === DEFAULT_ADMIN.password);

    if (isMatch) {
      this.isDeviceInitialized = true;
      this.isAdminUnlocked = false;
      localStorage.setItem(STORAGE_KEYS.DEVICE_INITIALIZED, 'true');
      return { success: true, message: 'Sign In berhasil!' };
    }

    return {
      success: false,
      message: 'Kredensial tidak cocok. Jika belum pernah mendaftar, silakan klik tab "Daftar Akun".'
    };
  }

  // 3. Register a new administrator account
  registerAdmin(emailOrUsername: string, pass: string): { success: boolean; message: string } {
    const cleanUser = emailOrUsername.trim();
    const cleanPass = pass.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Email/Username dan kata sandi tidak boleh kosong.' };
    }

    if (cleanPass.length < 6) {
      return { success: false, message: 'Kata sandi minimal 6 karakter demi keamanan.' };
    }

    this.adminEmail = cleanUser;
    this.adminPass = cleanPass;
    this.isDeviceInitialized = true;
    this.isAdminUnlocked = false;

    localStorage.setItem(STORAGE_KEYS.DEVICE_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, this.adminEmail);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, this.adminPass);

    return { success: true, message: 'Registrasi berhasil! Akun administrator aktif.' };
  }

  // Legacy compatibility for existing calls
  initialAdminLogin(email: string, pass: string): { success: boolean; message: string } {
    return this.signInAdmin(email, pass);
  }

  // 4. Admin Mode Gate (Check Password / PIN when clicking Admin Mode)
  isUnlocked(): boolean {
    return this.isAdminUnlocked;
  }

  unlockAdmin(inputPasswordOrPin: string): boolean {
    const clean = inputPasswordOrPin.trim();
    if (clean === this.adminPass || clean === this.adminPin || clean === DEFAULT_ADMIN.password || clean === DEFAULT_ADMIN.pin) {
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
