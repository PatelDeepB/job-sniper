/**
 * Master Profile and Configuration Types for JobSniper.
 */

export interface ContactInformation {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly location: string;
  readonly linkedInUrl: string;
  readonly githubUrl: string;
  readonly portfolioUrl: string;
}

export interface WorkAuthorization {
  readonly isAuthorizedInCountry: boolean;
  readonly requiresSponsorshipNow: boolean;
  readonly requiresSponsorshipFuture: boolean;
  readonly securityClearanceLevel: "none" | "secret" | "top_secret";
}

export interface TargetPreferences {
  readonly targetTitles: readonly string[];
  readonly minSalaryUSD: number;
  readonly remoteOnly: boolean;
  readonly targetLocations: readonly string[];
  readonly autoSnipeEnabled: boolean;
  readonly apiBaseUrl?: string;
}

export interface ExperienceBullet {
  readonly id: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isCurrent: boolean;
  readonly bulletPoint: string;
  readonly associatedSkills: readonly string[];
}

export interface MasterProfile {
  readonly contact: ContactInformation;
  readonly authorization: WorkAuthorization;
  readonly preferences: TargetPreferences;
  readonly headline: string;
  readonly summary: string;
  readonly coreSkills: readonly string[];
  readonly experienceBullets: readonly ExperienceBullet[];
  readonly yearsOfExperience: number;
}

export interface SnipedJobRecord {
  readonly id: string;
  readonly companyName: string;
  readonly jobTitle: string;
  readonly jobUrl: string;
  readonly platform: "greenhouse" | "lever" | "custom";
  readonly atsMatchScore: number;
  readonly appliedAt: string;
  readonly status: "sniped" | "reviewing" | "interview" | "rejected";
  readonly recruiterName?: string;
  readonly recruiterLinkedInUrl?: string;
}

export interface ApplicationStats {
  readonly jobsSnipedCount: number;
  readonly formsAutoFilledCount: number;
  readonly hoursSavedEstimate: number;
}
