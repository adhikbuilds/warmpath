import type { Account, Contact } from "@/types";
import {
  createTwentyCompany,
  createTwentyPerson,
  getTwentyCompanies,
  getTwentyPeople,
} from "./client";

// Map Twenty company → WarmBlue Account
export function mapTwentyCompanyToAccount(
  c: Awaited<ReturnType<typeof getTwentyCompanies>>[0],
): Account {
  const domain =
    c.domainName?.primaryLinkLabel ??
    c.domainName?.primaryLinkUrl?.replace(/https?:\/\//, "") ??
    "";
  return {
    id: `twenty-${c.id}`,
    name: c.name,
    domain,
    industry: c.industry ?? "",
    employee_count: c.employees ?? 0,
    location: "",
    description: "",
    stage: "prospect",
    fit_score: c.idealCustomerProfile ? 85 : 60,
    intent_score: 50,
    warmth_score: 40,
    opportunity_score: 55,
    created_at: c.createdAt,
  };
}

// Map Twenty person → WarmBlue Contact
export function mapTwentyPersonToContact(
  p: Awaited<ReturnType<typeof getTwentyPeople>>[0],
): Contact {
  const fullName = [p.name.firstName, p.name.lastName].filter(Boolean).join(" ");
  return {
    id: `twenty-${p.id}`,
    account_id: p.company ? `twenty-${p.company.id}` : "",
    name: fullName || "Unknown",
    email: p.emails?.primaryEmail ?? "",
    title: p.jobTitle ?? "",
    linkedin_url: p.linkedinLink?.primaryLinkUrl ?? undefined,
    seniority: "ic",
    department: "",
    persona: "",
    fit_score: 60,
    warmth_score: 40,
    engagement_score: 30,
  };
}

// Pull all accounts + contacts from Twenty and return as WarmBlue types
export async function syncFromTwenty(): Promise<{ accounts: Account[]; contacts: Contact[] }> {
  const [companies, people] = await Promise.all([getTwentyCompanies(), getTwentyPeople()]);
  return {
    accounts: companies.map(mapTwentyCompanyToAccount),
    contacts: people.map(mapTwentyPersonToContact),
  };
}

// Push a new WarmBlue account to Twenty
export async function pushAccountToTwenty(
  acc: Pick<Account, "name" | "domain" | "industry" | "employee_count">,
): Promise<void> {
  await createTwentyCompany({
    name: acc.name,
    domainName: acc.domain,
    employees: acc.employee_count,
    industry: acc.industry,
  });
}

// Push a new WarmBlue contact to Twenty
export async function pushContactToTwenty(
  contact: Pick<Contact, "name" | "email" | "title" | "linkedin_url">,
  twentyCompanyId?: string,
): Promise<void> {
  const [firstName, ...rest] = contact.name.split(" ");
  await createTwentyPerson({
    firstName: firstName ?? contact.name,
    lastName: rest.join(" ") || undefined,
    jobTitle: contact.title,
    email: contact.email || undefined,
    linkedinUrl: contact.linkedin_url,
    companyId: twentyCompanyId,
  });
}
