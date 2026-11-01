import { StorageService } from "../services/storage.js";

const SNIPER_ALARM_NAME = "jobsniper_snipe_alarm";
const API_BASE_URL = "http://localhost:8000";

class BackgroundSniperWorker {
  public static init(): void {
    if (typeof chrome === "undefined" || !chrome.alarms) {
      return;
    }

    chrome.runtime.onInstalled.addListener(() => {
      this.setupPeriodicAlarm();
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === SNIPER_ALARM_NAME) {
        this.pollFreshJobs();
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === "UPDATE_SNIPER_STATUS") {
        this.handleStatusUpdate(message.enabled);
        sendResponse({ success: true });
        return true;
      }
      return false;
    });

    chrome.notifications.onClicked.addListener((notificationId) => {
      if (notificationId.startsWith("snipe_")) {
        const rawUrl = notificationId.replace("snipe_", "");
        const targetUrl = decodeURIComponent(rawUrl);
        chrome.tabs.create({ url: targetUrl });
      }
    });
  }

  private static setupPeriodicAlarm(): void {
    chrome.alarms.create(SNIPER_ALARM_NAME, {
      periodInMinutes: 5
    });
  }

  private static async handleStatusUpdate(enabled: boolean): Promise<void> {
    if (enabled) {
      this.setupPeriodicAlarm();
      await this.pollFreshJobs();
    } else {
      chrome.alarms.clear(SNIPER_ALARM_NAME);
    }
  }

  private static async pollFreshJobs(): Promise<void> {
    const profile = await StorageService.loadProfile();
    if (!profile.preferences.autoSnipeEnabled) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sniper/feed?max_age_minutes=15`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const freshItems: Array<{
        id: string;
        company_name: string;
        title: string;
        url: string;
        estimated_age_minutes: number;
      }> = data.items || [];

      for (const job of freshItems) {
        const isMatch = profile.preferences.targetTitles.some((title) =>
          job.title.toLowerCase().includes(title.toLowerCase())
        );

        if (isMatch) {
          await this.triggerSnipeNotification(job);
          await StorageService.recordSnipedJob({
            id: job.id,
            companyName: job.company_name,
            jobTitle: job.title,
            jobUrl: job.url,
            platform: "greenhouse",
            atsMatchScore: 92,
            appliedAt: new Date().toISOString(),
            status: "sniped"
          });
          await StorageService.incrementApplicationStats(true);
        }
      }
    } catch {
      // Graceful offline fallback
    }
  }

  private static async triggerSnipeNotification(job: {
    company_name: string;
    title: string;
    url: string;
    estimated_age_minutes: number;
  }): Promise<void> {
    if (!chrome.notifications) {
      return;
    }

    const notificationId = `snipe_${encodeURIComponent(job.url)}`;
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "popup/popup.css", // Uses bundled resource as fallback icon
      title: "🎯 JobSniper: Fresh ATS Post Detected!",
      message: `${job.company_name} posted ${job.title} (${job.estimated_age_minutes}m ago). Click to open!`,
      priority: 2
    });
  }
}

BackgroundSniperWorker.init();
