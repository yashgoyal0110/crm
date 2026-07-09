import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// CRM Config seed data
import crmOpportunityTypeData from "../initial-data/crm_Opportunities_Type.json";
import crmOpportunitySaleStagesData from "../initial-data/crm_Opportunities_Sales_Stages.json";
import crmIndustryTypeData from "../initial-data/crm_Industry_Type.json";
import contactTypesData from "../initial-data/crm_Contact_Types.json";
import leadSourcesData from "../initial-data/crm_Lead_Sources.json";
import leadStatusesData from "../initial-data/crm_Lead_Statuses.json";
import leadTypesData from "../initial-data/crm_Lead_Types.json";

import { seedCurrencies } from "./currencies";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const DEMO_ADMIN_EMAIL = "test@mail.com";
const DEMO_ADMIN_PASSWORD = "Test@mail.com";
const DEMO_USER_EMAIL = "user@mail.com";
const DEMO_USER_PASSWORD = "User@mail.com";

async function upsertByName(
  model: any,
  items: { name: string; [key: string]: any }[]
) {
  for (const item of items) {
    await model.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }
}

async function upsertDemoUser({
  email,
  password,
  name,
  role,
}: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "manager" | "user";
}) {
  const user = await prisma.users.upsert({
    where: { email },
    update: {
      name,
      role,
      userStatus: "ACTIVE",
      emailVerified: true,
      userLanguage: "en",
    },
    create: {
      email,
      name,
      role,
      userStatus: "ACTIVE",
      emailVerified: true,
      userLanguage: "en",
    },
  });

  await prisma.account.deleteMany({
    where: {
      userId: user.id,
      providerId: "credential",
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(password),
    },
  });

  return user;
}

async function findOrCreateByName<T extends { id: string }>(
  model: any,
  name: string,
  data: Record<string, any>
): Promise<T> {
  const existing = await model.findFirst({ where: { name } });
  if (existing) {
    return model.update({
      where: { id: existing.id },
      data,
    });
  }
  return model.create({ data: { name, ...data } });
}

async function findOrCreateByField<T extends { id: string }>(
  model: any,
  where: Record<string, any>,
  data: Record<string, any>
): Promise<T> {
  const existing = await model.findFirst({ where });
  if (existing) {
    return model.update({
      where: { id: existing.id },
      data,
    });
  }
  return model.create({ data });
}

async function seedDemoData() {
  console.log("Seeding demo login users...");

  const admin = await upsertDemoUser({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    name: "Avery Demo Admin",
    role: "admin",
  });

  const salesUser = await upsertDemoUser({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    name: "Jordan Sales Rep",
    role: "user",
  });

  console.log("Demo users ready");

  const stages = await prisma.crm_Opportunities_Sales_Stages.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  const types = await prisma.crm_Opportunities_Type.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  const leadStatuses = await prisma.crm_Lead_Statuses.findMany({
    orderBy: { name: "asc" },
  });
  const leadSources = await prisma.crm_Lead_Sources.findMany({
    orderBy: { name: "asc" },
  });
  const leadTypes = await prisma.crm_Lead_Types.findMany({
    orderBy: { name: "asc" },
  });
  const contactTypes = await prisma.crm_Contact_Types.findMany({
    orderBy: { name: "asc" },
  });
  const industries = await prisma.crm_Industry_Type.findMany({
    orderBy: { name: "asc" },
  });

  console.log("Seeding B2B distribution CRM sample data...");

  const category = await findOrCreateByName<any>(
    prisma.crm_ProductCategories,
    "Industrial Distribution",
    {
      description: "High-margin distributor product lines and services.",
      order: 1,
      isActive: true,
      createdBy: admin.id,
      updatedBy: admin.id,
    }
  );

  const products = await Promise.all([
    prisma.crm_Products.upsert({
      where: { sku: "AI-ENRICH-250" },
      update: {
        name: "AI Account Enrichment Pack",
        description: "Enriches distributor accounts with firmographics, contacts, ICP fit and buying signals.",
        type: "SERVICE",
        status: "ACTIVE",
        unit_price: "12000.00",
        unit_cost: "3200.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "quarter",
        is_recurring: true,
        billing_period: "QUARTERLY",
        categoryId: category.id,
        updatedBy: admin.id,
      },
      create: {
        name: "AI Account Enrichment Pack",
        description: "Enriches distributor accounts with firmographics, contacts, ICP fit and buying signals.",
        sku: "AI-ENRICH-250",
        type: "SERVICE",
        status: "ACTIVE",
        unit_price: "12000.00",
        unit_cost: "3200.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "quarter",
        is_recurring: true,
        billing_period: "QUARTERLY",
        categoryId: category.id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.crm_Products.upsert({
      where: { sku: "PIPELINE-SCORE-PRO" },
      update: {
        name: "Pipeline Scoring Pro",
        description: "Scores open opportunities using activity, fit, urgency and product interest.",
        type: "SERVICE",
        status: "ACTIVE",
        unit_price: "18000.00",
        unit_cost: "5100.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "year",
        is_recurring: true,
        billing_period: "ANNUALLY",
        categoryId: category.id,
        updatedBy: admin.id,
      },
      create: {
        name: "Pipeline Scoring Pro",
        description: "Scores open opportunities using activity, fit, urgency and product interest.",
        sku: "PIPELINE-SCORE-PRO",
        type: "SERVICE",
        status: "ACTIVE",
        unit_price: "18000.00",
        unit_cost: "5100.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "year",
        is_recurring: true,
        billing_period: "ANNUALLY",
        categoryId: category.id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
    prisma.crm_Products.upsert({
      where: { sku: "DIST-DATA-HUB" },
      update: {
        name: "Distributor Data Hub",
        description: "Centralized account, product and sales intelligence workspace for distributor teams.",
        type: "PRODUCT",
        status: "ACTIVE",
        unit_price: "45000.00",
        unit_cost: "16000.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "workspace",
        is_recurring: true,
        billing_period: "ANNUALLY",
        categoryId: category.id,
        updatedBy: admin.id,
      },
      create: {
        name: "Distributor Data Hub",
        description: "Centralized account, product and sales intelligence workspace for distributor teams.",
        sku: "DIST-DATA-HUB",
        type: "PRODUCT",
        status: "ACTIVE",
        unit_price: "45000.00",
        unit_cost: "16000.00",
        currency: "USD",
        tax_rate: "0.00",
        unit: "workspace",
        is_recurring: true,
        billing_period: "ANNUALLY",
        categoryId: category.id,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    }),
  ]);

  const accountSeed = [
    {
      name: "Midwest Industrial Supply Co.",
      type: "Customer",
      status: "Active",
      city: "Chicago",
      state: "IL",
      revenue: "$84M",
      employees: "240",
      website: "https://midwestindustrial.example.com",
      email: "ops@midwestindustrial.example.com",
      phone: "+1 312 555 0138",
      description: "Regional MRO distributor expanding into predictive reorder and account-based selling.",
    },
    {
      name: "Harbor HVAC Wholesale",
      type: "Prospect",
      status: "Active",
      city: "Savannah",
      state: "GA",
      revenue: "$42M",
      employees: "115",
      website: "https://harborhvac.example.com",
      email: "buying@harborhvac.example.com",
      phone: "+1 912 555 0181",
      description: "HVAC parts wholesaler evaluating AI enrichment to prioritize contractor accounts.",
    },
    {
      name: "Pacific Electrical Distributors",
      type: "Customer",
      status: "Active",
      city: "Portland",
      state: "OR",
      revenue: "$126M",
      employees: "410",
      website: "https://pacificelectrical.example.com",
      email: "salesops@pacificelectrical.example.com",
      phone: "+1 503 555 0124",
      description: "Electrical supply distributor with multi-branch sales teams and fragmented account data.",
    },
    {
      name: "Keystone Safety Products",
      type: "Partner",
      status: "Active",
      city: "Pittsburgh",
      state: "PA",
      revenue: "$31M",
      employees: "86",
      website: "https://keystonesafety.example.com",
      email: "partners@keystonesafety.example.com",
      phone: "+1 412 555 0144",
      description: "Safety equipment distributor exploring cross-sell intelligence for enterprise accounts.",
    },
  ];

  const accounts = [];
  for (const item of accountSeed) {
    accounts.push(
      await findOrCreateByName<any>(prisma.crm_Accounts, item.name, {
        v: 0,
        createdBy: admin.id,
        updatedBy: admin.id,
        assigned_to: salesUser.id,
        annual_revenue: item.revenue,
        employees: item.employees,
        billing_city: item.city,
        billing_state: item.state,
        billing_country: "United States",
        shipping_city: item.city,
        shipping_state: item.state,
        shipping_country: "United States",
        description: item.description,
        email: item.email,
        name: item.name,
        office_phone: item.phone,
        status: item.status,
        type: item.type,
        website: item.website,
        industry: industries[0]?.id,
      })
    );
  }

  const contactSeed = [
    ["Maya", "Patel", "VP Sales Operations", "maya.patel@midwestindustrial.example.com", accounts[0]],
    ["Evan", "Brooks", "Director of Branch Growth", "evan.brooks@midwestindustrial.example.com", accounts[0]],
    ["Nora", "Kim", "Chief Revenue Officer", "nora.kim@harborhvac.example.com", accounts[1]],
    ["Luis", "Romero", "Regional Sales Manager", "luis.romero@pacificelectrical.example.com", accounts[2]],
    ["Priya", "Shah", "Procurement Analytics Lead", "priya.shah@keystonesafety.example.com", accounts[3]],
  ] as const;

  const contacts = [];
  for (const [first, last, position, email, account] of contactSeed) {
    contacts.push(
      await findOrCreateByField<any>(
        prisma.crm_Contacts,
        { email },
        {
          v: 0,
          first_name: first,
          last_name: last,
          email,
          office_phone: account.office_phone,
          position,
          account: account.id,
          accountsIDs: account.id,
          assigned_to: salesUser.id,
          createdBy: admin.id,
          updatedBy: admin.id,
          contact_type_id: contactTypes[0]?.id,
          tags: ["demo", "distribution", "decision-maker"],
          notes: [
            "Interested in AI-assisted account research.",
            "Prioritize pipeline visibility and branch-level adoption.",
          ],
          social_linkedin: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-demo`,
          description: `${position} at ${account.name}. Key stakeholder for sales intelligence rollout.`,
        }
      )
    );
  }

  const leadSeed = [
    ["Owen", "Reed", "Summit Plumbing Supply", "oreed@summitplumbing.example.com", "Inbound demo request"],
    ["Anika", "Morris", "Frontier Fasteners", "anika@frontierfasteners.example.com", "Imported from distributor target list"],
    ["Caleb", "Nguyen", "Metro Janitorial Supply", "caleb@metrojanitorial.example.com", "High ICP fit from enrichment run"],
  ] as const;

  for (const [firstName, lastName, company, email, description] of leadSeed) {
    await findOrCreateByField<any>(
      prisma.crm_Leads,
      { email },
      {
        firstName,
        lastName,
        company,
        email,
        jobTitle: "Revenue Operations",
        phone: "+1 555 0199",
        description,
        assigned_to: salesUser.id,
        createdBy: admin.id,
        updatedBy: admin.id,
        lead_source_id: leadSources[0]?.id,
        lead_status_id: leadStatuses[0]?.id,
        lead_type_id: leadTypes[0]?.id,
        campaign: "Q3 Distributor Intelligence Launch",
      }
    );
  }

  const opportunitySeed = [
    {
      name: "Midwest Industrial - Branch Intelligence Rollout",
      account: accounts[0],
      contact: contacts[0],
      budget: "84000.00",
      expected: "67200.00",
      stageIndex: 2,
      closeDays: 28,
      next: "Finalize pilot success metrics with VP Sales Ops.",
    },
    {
      name: "Harbor HVAC - Contractor Account Enrichment",
      account: accounts[1],
      contact: contacts[2],
      budget: "36000.00",
      expected: "18000.00",
      stageIndex: 1,
      closeDays: 45,
      next: "Send enrichment sample for top 50 contractor accounts.",
    },
    {
      name: "Pacific Electrical - Pipeline Scoring Expansion",
      account: accounts[2],
      contact: contacts[3],
      budget: "118000.00",
      expected: "94400.00",
      stageIndex: 3,
      closeDays: 18,
      next: "Legal review of annual platform agreement.",
    },
    {
      name: "Keystone Safety - Cross-Sell Signal Pilot",
      account: accounts[3],
      contact: contacts[4],
      budget: "24000.00",
      expected: "9600.00",
      stageIndex: 0,
      closeDays: 60,
      next: "Book discovery with sales leadership.",
    },
  ];

  const opportunities = [];
  for (const item of opportunitySeed) {
    const opportunity = await findOrCreateByField<any>(
      prisma.crm_Opportunities,
      { name: item.name },
      {
        name: item.name,
        account: item.account.id,
        contact: item.contact.id,
        assigned_to: salesUser.id,
        createdBy: admin.id,
        updatedBy: admin.id,
        budget: item.budget,
        expected_revenue: item.expected,
        currency: "USD",
        snapshot_rate: "1.00000000",
        sales_stage: stages[item.stageIndex]?.id ?? stages[0]?.id,
        type: types[0]?.id,
        close_date: new Date(Date.now() + item.closeDays * 24 * 60 * 60 * 1000),
        last_activity: new Date(),
        next_step: item.next,
        status: "ACTIVE",
        description: "Demo pipeline opportunity for the AI Sales Intelligence Platform.",
      }
    );
    opportunities.push(opportunity);

    const product = products[opportunities.length % products.length];
    await findOrCreateByField<any>(
      prisma.crm_OpportunityLineItems,
      { opportunityId: opportunity.id, sku: product.sku },
      {
        opportunityId: opportunity.id,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        quantity: 1,
        unit_price: product.unit_price,
        discount_type: "PERCENTAGE",
        discount_value: "0.00",
        line_total: product.unit_price,
        currency: "USD",
        sort_order: 1,
        createdBy: admin.id,
        updatedBy: admin.id,
      }
    );
  }

  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    const product = products[index % products.length];
    await findOrCreateByField<any>(
      prisma.crm_AccountProducts,
      { accountId: account.id, productId: product.id },
      {
        accountId: account.id,
        productId: product.id,
        quantity: index + 1,
        custom_price: product.unit_price,
        currency: "USD",
        snapshot_rate: "1.00000000",
        status: index === 1 ? "PENDING" : "ACTIVE",
        start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        renewal_date: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
        notes: "Seeded demo product relationship for account expansion view.",
        createdBy: admin.id,
        updatedBy: admin.id,
      }
    );
  }

  const contract = await findOrCreateByField<any>(
    prisma.crm_Contracts,
    { title: "Pacific Electrical - Annual Intelligence Agreement" },
    {
      v: 0,
      title: "Pacific Electrical - Annual Intelligence Agreement",
      value: "118000.00",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      renewalReminderDate: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
      description: "Annual agreement for pipeline scoring and distributor data hub.",
      account: accounts[2].id,
      assigned_to: salesUser.id,
      createdBy: admin.id,
      updatedBy: admin.id,
      status: "INPROGRESS",
      type: "Annual SaaS",
      currency: "USD",
      snapshot_rate: "1.00000000",
    }
  );

  await findOrCreateByField<any>(
    prisma.crm_ContractLineItems,
    { contractId: contract.id, sku: products[2].sku },
    {
      contractId: contract.id,
      productId: products[2].id,
      name: products[2].name,
      sku: products[2].sku,
      description: products[2].description,
      quantity: 1,
      unit_price: products[2].unit_price,
      discount_type: "PERCENTAGE",
      discount_value: "0.00",
      line_total: products[2].unit_price,
      currency: "USD",
      sort_order: 1,
      createdBy: admin.id,
      updatedBy: admin.id,
    }
  );

  const activitySeed = [
    ["meeting", "Executive discovery with Harbor HVAC", accounts[1].id, "Discussed contractor account segmentation and buying signals."],
    ["call", "Midwest pilot success review", accounts[0].id, "Confirmed branch managers want weekly account recommendations."],
    ["note", "Pacific legal review", accounts[2].id, "Procurement requested annual pricing and data retention language."],
  ] as const;

  for (const [type, title, entityId, description] of activitySeed) {
    const activity = await findOrCreateByField<any>(
      prisma.crm_Activities,
      { title },
      {
        type,
        title,
        description,
        date: new Date(),
        duration: type === "note" ? undefined : 45,
        outcome: "Next step scheduled",
        status: "completed",
        metadata: { demo: true, segment: "B2B distribution" },
        createdBy: admin.id,
        updatedBy: admin.id,
      }
    );

    await findOrCreateByField<any>(
      prisma.crm_ActivityLinks,
      { activityId: activity.id, entityType: "account", entityId },
      {
        activityId: activity.id,
        entityType: "account",
        entityId,
      }
    );
  }

  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    await findOrCreateByField<any>(
      prisma.crm_Accounts_Tasks,
      { title: `Prepare AI enrichment brief for ${account.name}` },
      {
        v: 0,
        title: `Prepare AI enrichment brief for ${account.name}`,
        content: "Summarize ICP fit, buying committee, branch network and recommended next action.",
        priority: index < 2 ? "High" : "Medium",
        tags: ["demo", "enrichment", "pipeline"],
        user: salesUser.id,
        taskStatus: "ACTIVE",
        account: account.id,
        createdBy: admin.id,
        updatedBy: admin.id,
        dueDateAt: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000),
      }
    );
  }

  const board = await findOrCreateByField<any>(
    prisma.boards,
    { title: "Distributor Growth Workspace", user: salesUser.id },
    {
      v: 0,
      title: "Distributor Growth Workspace",
      description: "Demo workspace for sales follow-ups, enrichment tasks and pipeline reviews.",
      icon: "kanban",
      favourite: true,
      favouritePosition: BigInt(1),
      position: BigInt(1),
      user: salesUser.id,
      visibility: "private",
      sharedWith: [admin.id],
      createdBy: admin.id,
      updatedBy: admin.id,
    }
  );

  const sectionNames = ["Research", "Outreach", "Proposal"];
  for (let sectionIndex = 0; sectionIndex < sectionNames.length; sectionIndex += 1) {
    const title = sectionNames[sectionIndex];
    const section = await findOrCreateByField<any>(
      prisma.sections,
      { title, board: board.id },
      {
        v: 0,
        title,
        board: board.id,
        position: BigInt(sectionIndex + 1),
      }
    );

    await findOrCreateByField<any>(
      prisma.tasks,
      { title: `${title}: distributor demo task`, section: section.id },
      {
        v: 0,
        title: `${title}: distributor demo task`,
        content: "Use DistIQ to move the account from raw signal to qualified pipeline.",
        priority: sectionIndex === 0 ? "High" : "Medium",
        section: section.id,
        tags: ["demo", "sales-intelligence"],
        position: BigInt(sectionIndex + 1),
        likes: BigInt(sectionIndex),
        user: salesUser.id,
        taskStatus: "ACTIVE",
        createdBy: admin.id,
        updatedBy: admin.id,
        dueDateAt: new Date(Date.now() + (sectionIndex + 1) * 24 * 60 * 60 * 1000),
      }
    );
  }

  const targetList = await findOrCreateByName<any>(
    prisma.crm_TargetLists,
    "Top Distributor Expansion Targets",
    {
      description: "Seeded target list for enrichment and campaign exploration.",
      status: true,
      created_by: admin.id,
    }
  );

  const target = await findOrCreateByField<any>(
    prisma.crm_Targets,
    { email: "samantha.lee@northernweld.example.com" },
    {
      first_name: "Samantha",
      last_name: "Lee",
      email: "samantha.lee@northernweld.example.com",
      mobile_phone: "+1 555 0177",
      company: "Northern Weld Supply",
      company_website: "https://northernweld.example.com",
      position: "VP Commercial Operations",
      social_linkedin: "https://linkedin.com/in/samantha-lee-demo",
      status: true,
      tags: ["demo", "target", "enrichment-ready"],
      notes: ["Strong fit for branch-level opportunity scoring."],
      created_by: admin.id,
      updatedBy: admin.id,
      city: "Milwaukee",
      country: "United States",
      industry: "Industrial Distribution",
      employees: "180",
      description: "High-fit expansion target for AI enrichment workflow.",
    }
  );

  await prisma.targetsToTargetLists.upsert({
    where: {
      target_id_target_list_id: {
        target_id: target.id,
        target_list_id: targetList.id,
      },
    },
    update: {},
    create: {
      target_id: target.id,
      target_list_id: targetList.id,
    },
  });

  const template = await findOrCreateByName<any>(
    prisma.crm_campaign_templates,
    "Distributor Insight Intro",
    {
      description: "Demo outbound template for distributor leaders.",
      subject_default: "Your branch sales data is hiding expansion signals",
      content_html:
        "<p>Hi {{first_name}},</p><p>DistIQ helps distributor teams prioritize accounts, enrich contacts, and turn buying signals into pipeline.</p>",
      content_json: {
        blocks: [
          { type: "paragraph", text: "DistIQ helps distributor teams prioritize accounts and enrich pipeline." },
        ],
      },
      created_by: admin.id,
    }
  );

  const campaign = await findOrCreateByName<any>(
    prisma.crm_campaigns,
    "Q3 Distributor Intelligence Launch",
    {
      v: 0,
      description: "Demo campaign connected to enrichment-ready distributor targets.",
      status: "draft",
      template_id: template.id,
      from_name: "DistIQ Growth Team",
      reply_to: DEMO_ADMIN_EMAIL,
      created_by: admin.id,
    }
  );

  await prisma.campaignToTargetLists.upsert({
    where: {
      campaign_id_target_list_id: {
        campaign_id: campaign.id,
        target_list_id: targetList.id,
      },
    },
    update: {},
    create: {
      campaign_id: campaign.id,
      target_list_id: targetList.id,
    },
  });

  await prisma.crm_Report_Config.upsert({
    where: { id: "demo-sales-pipeline-report" },
    update: {
      name: "Demo Sales Pipeline Snapshot",
      category: "sales",
      filters: { status: "ACTIVE", segment: "B2B distribution" },
      isShared: true,
      createdBy: admin.id,
    },
    create: {
      id: "demo-sales-pipeline-report",
      name: "Demo Sales Pipeline Snapshot",
      category: "sales",
      filters: { status: "ACTIVE", segment: "B2B distribution" },
      isShared: true,
      createdBy: admin.id,
    },
  });

  console.log("Demo CRM dataset seeded");
}

async function main() {
  console.log("-------- Seeding DB --------");

  // CRM Opportunity Types (no unique on name — use findFirst + create/update)
  for (const item of crmOpportunityTypeData) {
    const existing = await prisma.crm_Opportunities_Type.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Opportunities_Type.update({
        where: { id: existing.id },
        data: { name: item.name, order: item.order, v: item.v },
      });
    } else {
      await prisma.crm_Opportunities_Type.create({
        data: { name: item.name, order: item.order, v: item.v },
      });
    }
  }
  console.log("Opportunity Types seeded");

  // CRM Opportunity Sales Stages (no unique on name — use findFirst + create/update)
  for (const item of crmOpportunitySaleStagesData) {
    const existing = await prisma.crm_Opportunities_Sales_Stages.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Opportunities_Sales_Stages.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          probability: item.probability,
          order: item.order,
          v: item.v,
        },
      });
    } else {
      await prisma.crm_Opportunities_Sales_Stages.create({
        data: {
          name: item.name,
          probability: item.probability,
          order: item.order,
          v: item.v,
        },
      });
    }
  }
  console.log("Opportunity Sales Stages seeded");

  // CRM Industry Types (no unique on name — use findFirst + create/update)
  for (const item of crmIndustryTypeData) {
    const existing = await prisma.crm_Industry_Type.findFirst({
      where: { name: item.name },
    });
    if (existing) {
      await prisma.crm_Industry_Type.update({
        where: { id: existing.id },
        data: { name: item.name, v: item.v },
      });
    } else {
      await prisma.crm_Industry_Type.create({
        data: { name: item.name, v: item.v },
      });
    }
  }
  console.log("Industry Types seeded");

  // CRM Contact Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Contact_Types, contactTypesData);
  console.log("Contact Types seeded");

  // CRM Lead Sources (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Sources, leadSourcesData);
  console.log("Lead Sources seeded");

  // CRM Lead Statuses (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Statuses, leadStatusesData);
  console.log("Lead Statuses seeded");

  // CRM Lead Types (has @unique on name — can use upsert)
  await upsertByName(prisma.crm_Lead_Types, leadTypesData);
  console.log("Lead Types seeded");

  // Currencies and Exchange Rates
  await seedCurrencies(prisma);

  await seedDemoData();

  console.log("-------- Seed DB completed --------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
