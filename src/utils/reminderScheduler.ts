/**
 * Z.Z KHATA - Local Offline Reminder & Alarm Scheduler
 * Works 100% offline without internet connection.
 * Uses local browser/Android notifications, vibrations, and audio alarms.
 */

export interface LocalKhataReminder {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: 'MILE' | 'DIYE';
  scheduledTime: number; // Unix timestamp ms
  note?: string;
  phone?: string;
  fired?: boolean;
}

const STORAGE_KEY_REMINDERS = 'zz_khata_offline_reminders_v1';

class LocalReminderScheduler {
  private timerInterval: any = null;

  constructor() {
    this.startWatcher();
  }

  getAll(): LocalKhataReminder[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  saveAll(reminders: LocalKhataReminder[]) {
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(reminders));
    } catch {}
  }

  schedule(reminder: Omit<LocalKhataReminder, 'id' | 'fired'>): LocalKhataReminder {
    const reminders = this.getAll();
    const newReminder: LocalKhataReminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fired: false,
    };
    reminders.push(newReminder);
    this.saveAll(reminders);

    // If scheduled within 1 minute, schedule immediate timeout
    const delay = newReminder.scheduledTime - Date.now();
    if (delay > 0 && delay < 60000) {
      setTimeout(() => {
        this.fireNotification(newReminder);
      }, delay);
    }

    return newReminder;
  }

  cancel(id: string) {
    const filtered = this.getAll().filter((r) => r.id !== id);
    this.saveAll(filtered);
  }

  private startWatcher() {
    if (typeof window === 'undefined') return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.checkDueReminders();
    }, 15000); // Check every 15s locally
  }

  checkDueReminders() {
    const now = Date.now();
    const reminders = this.getAll();
    let updated = false;

    for (const r of reminders) {
      if (!r.fired && r.scheduledTime <= now) {
        this.fireNotification(r);
        r.fired = true;
        updated = true;
      }
    }

    if (updated) {
      this.saveAll(reminders);
    }
  }

  private fireNotification(reminder: LocalKhataReminder) {
    // 1. Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {}
    }

    // 2. Local Audio chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}

    // 3. Local Native Notification
    const title = `🔔 Z.Z KHATA: ${reminder.customerName}`;
    const actionText = reminder.type === 'MILE' ? 'Wapis Lene Hain' : 'Ada Karne Hain';
    const body = `Rs. ${reminder.amount.toLocaleString()} - ${actionText}${reminder.note ? ` (${reminder.note})` : ''}`;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/favicon.png',
              tag: reminder.id,
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
          });
        }
      } catch (e) {
        console.warn('Local notification error:', e);
      }
    }
  }
}

export const reminderScheduler = new LocalReminderScheduler();
