/** Shared Workbrio M1 (profiles) + M2 (jobs) database types. */

export type Role = "freelancer" | "client";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  hourly_rate: number | null;
  avatar_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export type Skill = {
  id: string;
  name: string;
};

export type PortfolioItem = {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  profile_id: string;
  reviewer_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ReviewWithReviewer = Review & {
  reviewer_name: string | null;
  reviewer_avatar: string | null;
};

export type ProfileFull = Profile & {
  skills: Skill[];
  portfolio: PortfolioItem[];
  reviews: ReviewWithReviewer[];
  avg_rating: number | null;
  review_count: number;
};

/**
 * Normalizes a Supabase-embedded `skills` relation into a flat Skill list.
 * Handles both the object form (many-to-one join) and the array form that
 * the untyped client infers.
 */
export function toSkillList(
  rows: { skills: unknown }[] | null | undefined
): Skill[] {
  const out: Skill[] = [];
  for (const row of rows ?? []) {
    const embedded = (row as { skills?: unknown }).skills;
    const items = Array.isArray(embedded) ? embedded : embedded ? [embedded] : [];
    for (const item of items) {
      const skill = item as Skill | null | undefined;
      if (
        skill &&
        typeof skill.id === "string" &&
        typeof skill.name === "string"
      ) {
        out.push({ id: skill.id, name: skill.name });
      }
    }
  }
  return out;
}

/* ---------------- M2: Jobs & Proposals ---------------- */

export type JobStatus = "open" | "closed" | "in_progress";
export type BudgetType = "fixed" | "hourly";
export type ProposalStatus = "pending" | "accepted" | "declined";

/** Real employment jobs (M6): full-time, part-time, contract, internship, remote. */
export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "remote";

export const JOB_TYPES: JobType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
};

export type Job = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_type: BudgetType;
  /** Null when the salary/budget is not published — shown as "Salary not listed". */
  budget_amount: number | null;
  skills_required: string[];
  status: JobStatus;
  created_at: string;
  updated_at: string;
  /** M6 job-board fields — all optional; empty for classic freelance gigs. */
  company_name: string | null;
  /** Country/city, e.g. "Lahore, Pakistan" or "Remote — Worldwide". */
  location: string | null;
  /** Where to apply (the employer's real page). Null = apply via Workbrio proposal. */
  apply_url: string | null;
  /** Last date to apply (YYYY-MM-DD). Null = no published deadline. */
  deadline: string | null;
  job_type: JobType | null;
  /** Where this job was found, e.g. "Rozee.pk". Shown so anyone can verify it. */
  source_name: string | null;
  /** M6b: one generic photo for the job card (Unsplash/Pexels hotlink).
      Null = no banner; the card looks exactly as before. */
  image_url: string | null;
  /** M6c: employer-stated pay as free text, e.g. "£32,073–£39,043 / year".
      The budget field is a single number and cannot honestly hold a
      range — that is why ranged jobs showed "Salary not listed".
      Null = no published pay — shown as "Salary not listed". */
  salary_text: string | null;
};

export type Proposal = {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_note: string | null;
  bid_amount: number | null;
  cv_url: string | null;
  status: ProposalStatus;
  created_at: string;
};

export type JobWithClient = Job & {
  client_name: string | null;
  client_avatar: string | null;
  client_headline: string | null;
  client_location: string | null;
};

export type ProposalWithFreelancer = Proposal & {
  freelancer_name: string | null;
  freelancer_avatar: string | null;
  freelancer_headline: string | null;
  freelancer_rate: number | null;
};

export type ProposalWithJob = Proposal & {
  job_title: string | null;
  job_status: JobStatus | null;
  job_budget_type: BudgetType | null;
  job_budget_amount: number | null;
  /** M6c: employer-stated pay text, so employment jobs show their range. */
  job_salary_text: string | null;
  /** M6: set for own-posted employment jobs — drives "application" wording. */
  job_type: JobType | null;
  job_id_ref: string;
  client_name: string | null;
};

/** "3 days ago" style relative time for cards. */
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** "$1,200 fixed" / "$45/hr" budget label — or "Salary not listed" when unpublished. */
export function budgetLabel(type: BudgetType, amount: number | null): string {
  if (amount == null) return "Salary not listed";
  const formatted = `$${Number(amount).toLocaleString("en-US")}`;
  return type === "hourly" ? `${formatted}/hr` : `${formatted} fixed`;
}

/** The pay to show for a job: the employer-stated range as text when
    present ("£32,073–£39,043 / year"), else the numeric budget label. */
export function salaryLabel(
  job: Pick<Job, "salary_text" | "budget_type" | "budget_amount">
): string {
  const text = job.salary_text?.trim();
  if (text) return text;
  return budgetLabel(job.budget_type, job.budget_amount);
}

/** "12 Dec 2026" for a YYYY-MM-DD deadline (UTC-safe, no timezone shift). */
export function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const parts = iso.slice(0, 10).split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today as YYYY-MM-DD (UTC), for deadline comparisons. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True when a job's last date has passed. A job is still live ON its
    deadline day; it expires the day after. Null deadline = never expires. */
export function isJobExpired(job: { deadline: string | null }): boolean {
  return job.deadline != null && job.deadline < todayISO();
}

/* ---------------- M3: Feed ---------------- */

export type Post = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PostWithAuthor = Post & {
  author_name: string | null;
  author_avatar: string | null;
  author_headline: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type CommentWithAuthor = Comment & {
  author_name: string | null;
  author_avatar: string | null;
};

/* ---------------- M6e: Job comments ---------------- */

export type JobComment = {
  id: string;
  job_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type JobCommentWithAuthor = JobComment & {
  author_name: string | null;
  author_avatar: string | null;
};

/* ---------------- M4: Messaging & Notifications ---------------- */

export type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  job_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationType =
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_declined"
  | "new_message";

export type NotificationItem = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type ConversationWithPeer = Conversation & {
  peer_id: string;
  peer_name: string | null;
  peer_avatar: string | null;
  peer_headline: string | null;
  job_title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
};

export type MessageWithSender = Message & {
  sender_name: string | null;
  sender_avatar: string | null;
};

export type ReportTargetType = "post" | "job" | "profile" | "message";
export type ReportStatus = "open" | "reviewed" | "actioned";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
};

/* ---------------- Services (gig storefront) ---------------- */

export type ServiceStatus = "active" | "paused";

export type Service = {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_days: number;
  skills: string[];
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
};

export type ServiceWithFreelancer = Service & {
  freelancer_name: string | null;
  freelancer_avatar: string | null;
  freelancer_headline: string | null;
  freelancer_location: string | null;
  freelancer_rate: number | null;
};

export const SERVICE_CATEGORIES = [
  "Design",
  "Development",
  "Writing",
  "Marketing",
  "Video Editing",
  "Translation",
  "Other",
] as const;

/** "$50" starting-price label. */
export function servicePriceLabel(amount: number): string {
  return `$${Number(amount).toLocaleString("en-US")}`;
}

/** "3 days" delivery label. */
export function deliveryLabel(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}

export const REPORT_REASONS = [
  "Spam or misleading",
  "Scam or fraud",
  "Harassment or hate speech",
  "Inappropriate content",
  "Fake profile or job",
  "Something else",
] as const;
