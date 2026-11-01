import { MasterProfile, SnipedJobRecord, ApplicationStats } from "../types/profile.js";

const DEFAULT_PROFILE: MasterProfile = {
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedInUrl: "",
    githubUrl: "",
    portfolioUrl: ""
  },
  authorization: {
    isAuthorizedInCountry: true,
    requiresSponsorshipNow: false,
    requiresSponsorshipFuture: false,
    securityClearanceLevel: "none"
  },
  preferences: {
    targetTitles: ["Software Engineer", "Full Stack Developer", "Backend Engineer"],
    minSalaryUSD: 100000,
    remoteOnly: true,
    targetLocations: ["Remote", "United States"],
    autoSnipeEnabled: false,
    apiBaseUrl: "http://localhost:8000"
  },
  headline: "",
  summary: "",
  coreSkills: [],
  experienceBullets: [],
  yearsOfExperience: 3
};

const DEFAULT_STATS: ApplicationStats = {
  jobsSnipedCount: 0,
  formsAutoFilledCount: 0,
  hoursSavedEstimate: 0
};

export class StorageService {
  private static readonly PROFILE_KEY = "jobsniper_master_profile";
  private static readonly STATS_KEY = "jobsniper_application_stats";
  private static readonly SNIPED_JOBS_KEY = "jobsniper_sniped_records";

  public static async loadProfile(): Promise<MasterProfile> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(this.PROFILE_KEY);
      return (result[this.PROFILE_KEY] as MasterProfile) || DEFAULT_PROFILE;
    }
    const rawData = localStorage.getItem(this.PROFILE_KEY);
    return rawData ? JSON.parse(rawData) : DEFAULT_PROFILE;
  }

  public static async saveProfile(profile: MasterProfile): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.PROFILE_KEY]: profile });
      return;
    }
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  public static async getApiBaseUrl(): Promise<string> {
    const profile = await this.loadProfile();
    const rawUrl = profile.preferences?.apiBaseUrl || "http://localhost:8000";
    return rawUrl.trim().replace(/\/+$/, "");
  }

  public static async loadStats(): Promise<ApplicationStats> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(this.STATS_KEY);
      return (result[this.STATS_KEY] as ApplicationStats) || DEFAULT_STATS;
    }
    const rawData = localStorage.getItem(this.STATS_KEY);
    return rawData ? JSON.parse(rawData) : DEFAULT_STATS;
  }

  public static async incrementApplicationStats(isSnipe: boolean = false): Promise<ApplicationStats> {
    const currentStats = await this.loadStats();
    const updatedStats: ApplicationStats = {
      jobsSnipedCount: currentStats.jobsSnipedCount + (isSnipe ? 1 : 0),
      formsAutoFilledCount: currentStats.formsAutoFilledCount + 1,
      hoursSavedEstimate: Number((currentStats.hoursSavedEstimate + 0.35).toFixed(2))
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.STATS_KEY]: updatedStats });
    } else {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(updatedStats));
    }

    return updatedStats;
  }

  public static async getSnipedJobs(): Promise<readonly SnipedJobRecord[]> {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(this.SNIPED_JOBS_KEY);
      return (result[this.SNIPED_JOBS_KEY] as readonly SnipedJobRecord[]) || [];
    }
    const rawData = localStorage.getItem(this.SNIPED_JOBS_KEY);
    return rawData ? JSON.parse(rawData) : [];
  }

  public static async recordSnipedJob(record: SnipedJobRecord): Promise<void> {
    const currentRecords = await this.getSnipedJobs();
    const updatedRecords = [record, ...currentRecords.slice(0, 49)];

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.SNIPED_JOBS_KEY]: updatedRecords });
    } else {
      localStorage.setItem(this.SNIPED_JOBS_KEY, JSON.stringify(updatedRecords));
    }
  }
}
