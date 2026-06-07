// GraphQL client for Twenty CRM API
// Docs: https://twenty.com/developers/api

const TWENTY_API_URL = process.env.TWENTY_API_URL ?? "http://localhost:3000/graphql";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? "";

async function twentyQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(TWENTY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Twenty API error: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Companies (maps to Account) ──────────────────────────────────────────────

export interface TwentyCompany {
  id: string;
  name: string;
  domainName?: { primaryLinkLabel?: string; primaryLinkUrl?: string };
  employees?: number;
  industry?: string;
  idealCustomerProfile?: boolean;
  annualRecurringRevenue?: { amountMicros?: string; currencyCode?: string };
  linkedinLink?: { primaryLinkLabel?: string; primaryLinkUrl?: string };
  createdAt: string;
}

export async function getTwentyCompanies(): Promise<TwentyCompany[]> {
  const data = await twentyQuery<{ companies: { edges: { node: TwentyCompany }[] } }>(`
    query {
      companies(orderBy: { createdAt: DescNullsLast }) {
        edges {
          node {
            id name employees industry idealCustomerProfile createdAt
            domainName { primaryLinkLabel primaryLinkUrl }
            linkedinLink { primaryLinkLabel primaryLinkUrl }
          }
        }
      }
    }
  `);
  return data.companies.edges.map((e) => e.node);
}

export async function createTwentyCompany(input: {
  name: string;
  domainName?: string;
  employees?: number;
  industry?: string;
}): Promise<TwentyCompany> {
  const data = await twentyQuery<{ createCompany: TwentyCompany }>(
    `
    mutation CreateCompany($input: CompanyCreateInput!) {
      createCompany(data: $input) { id name createdAt }
    }
  `,
    {
      input: {
        name: input.name,
        domainName: input.domainName
          ? {
              primaryLinkLabel: input.domainName,
              primaryLinkUrl: `https://${input.domainName}`,
            }
          : undefined,
        employees: input.employees,
        industry: input.industry,
      },
    },
  );
  return data.createCompany;
}

// ─── People (maps to Contact) ─────────────────────────────────────────────────

export interface TwentyPerson {
  id: string;
  name: { firstName?: string; lastName?: string };
  jobTitle?: string;
  emails?: { primaryEmail?: string };
  linkedinLink?: { primaryLinkLabel?: string; primaryLinkUrl?: string };
  company?: { id: string; name: string };
  createdAt: string;
}

export async function getTwentyPeople(): Promise<TwentyPerson[]> {
  const data = await twentyQuery<{ people: { edges: { node: TwentyPerson }[] } }>(`
    query {
      people(orderBy: { createdAt: DescNullsLast }) {
        edges {
          node {
            id jobTitle createdAt
            name { firstName lastName }
            emails { primaryEmail }
            linkedinLink { primaryLinkLabel primaryLinkUrl }
            company { id name }
          }
        }
      }
    }
  `);
  return data.people.edges.map((e) => e.node);
}

export async function createTwentyPerson(input: {
  firstName: string;
  lastName?: string;
  jobTitle?: string;
  email?: string;
  linkedinUrl?: string;
  companyId?: string;
}): Promise<TwentyPerson> {
  const data = await twentyQuery<{ createPerson: TwentyPerson }>(
    `
    mutation CreatePerson($input: PersonCreateInput!) {
      createPerson(data: $input) { id jobTitle createdAt name { firstName lastName } }
    }
  `,
    {
      input: {
        name: { firstName: input.firstName, lastName: input.lastName ?? "" },
        jobTitle: input.jobTitle,
        emails: input.email ? { primaryEmail: input.email } : undefined,
        linkedinLink: input.linkedinUrl
          ? { primaryLinkLabel: input.linkedinUrl, primaryLinkUrl: input.linkedinUrl }
          : undefined,
        company: input.companyId ? { connect: { id: input.companyId } } : undefined,
      },
    },
  );
  return data.createPerson;
}

export { twentyQuery };
