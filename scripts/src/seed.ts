import {
  db,
  pool,
  tenantsTable,
  usersTable,
  lgasTable,
  wardsTable,
  applicationsTable,
  documentsTable,
  paymentsTable,
  certificatesTable,
  auditLogsTable,
  notificationsTable,
} from "@workspace/db";

function ref(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.floor(
    Math.random() * 9000 + 1000,
  )}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Clearing existing data...");
  await db.delete(notificationsTable);
  await db.delete(auditLogsTable);
  await db.delete(certificatesTable);
  await db.delete(paymentsTable);
  await db.delete(documentsTable);
  await db.delete(applicationsTable);
  await db.delete(wardsTable);
  await db.delete(lgasTable);
  await db.delete(usersTable);
  await db.delete(tenantsTable);

  console.log("Seeding tenants...");
  const tenantsSeed = [
    {
      name: "Lagos State",
      code: "LA",
      slug: "lagos",
      certificatePrefix: "LAG",
      fee: "5000",
      currency: "NGN",
      status: "active",
      contactEmail: "indigene@lagosstate.gov.ng",
      contactPhone: "+234 1 700 0001",
      address: "The Secretariat, Alausa, Ikeja, Lagos",
      capital: "Ikeja",
      primaryColor: "#1f7a4d",
      tagline: "Centre of Excellence",
    },
    {
      name: "Kano State",
      code: "KN",
      slug: "kano",
      certificatePrefix: "KAN",
      fee: "3500",
      currency: "NGN",
      status: "active",
      contactEmail: "indigene@kanostate.gov.ng",
      contactPhone: "+234 64 700 0002",
      address: "Government House, Kano",
      capital: "Kano",
      primaryColor: "#0f5b8a",
      tagline: "Centre of Commerce",
    },
    {
      name: "Enugu State",
      code: "EN",
      slug: "enugu",
      certificatePrefix: "ENU",
      fee: "4000",
      currency: "NGN",
      status: "suspended",
      contactEmail: "indigene@enugustate.gov.ng",
      contactPhone: "+234 42 700 0003",
      address: "Government House, Independence Layout, Enugu",
      capital: "Enugu",
      primaryColor: "#7a3b1f",
      tagline: "Coal City State",
    },
  ];
  const tenants = await db.insert(tenantsTable).values(tenantsSeed).returning();
  const lagos = tenants[0];
  const kano = tenants[1];

  console.log("Seeding users...");
  const usersSeed = [
    { name: "Adaeze Okafor", email: "superadmin@indigene.gov.ng", role: "super_admin", tenantId: null },
    { name: "Bola Adeyemi", email: "admin@lagosstate.gov.ng", role: "tenant_admin", tenantId: lagos.id },
    { name: "Chinedu Eze", email: "officer1@lagosstate.gov.ng", role: "officer", tenantId: lagos.id },
    { name: "Funke Bello", email: "officer2@lagosstate.gov.ng", role: "officer", tenantId: lagos.id },
    { name: "Tunde Balogun", email: "tunde@example.com", role: "applicant", tenantId: lagos.id },
    { name: "Ngozi Okwu", email: "ngozi@example.com", role: "applicant", tenantId: lagos.id },
    { name: "Ibrahim Sani", email: "admin@kanostate.gov.ng", role: "tenant_admin", tenantId: kano.id },
    { name: "Aisha Yusuf", email: "officer@kanostate.gov.ng", role: "officer", tenantId: kano.id },
  ];
  const users = await db.insert(usersTable).values(usersSeed).returning();
  const lagosAdmin = users[1];
  const officer1 = users[2];
  const officer2 = users[3];
  const applicant1 = users[4];
  const applicant2 = users[5];
  const kanoOfficer = users[7];

  console.log("Seeding geography...");
  const lagosLgaNames = ["Ikeja", "Eti-Osa", "Alimosho", "Surulere", "Badagry"];
  const kanoLgaNames = ["Nassarawa", "Fagge", "Dala", "Gwale"];
  const lagosLgas = await db
    .insert(lgasTable)
    .values(lagosLgaNames.map((name) => ({ tenantId: lagos.id, name })))
    .returning();
  const kanoLgas = await db
    .insert(lgasTable)
    .values(kanoLgaNames.map((name) => ({ tenantId: kano.id, name })))
    .returning();

  const wardSeed: { lgaId: number; name: string }[] = [];
  for (const lga of [...lagosLgas, ...kanoLgas]) {
    for (let i = 1; i <= 3; i++) {
      wardSeed.push({ lgaId: lga.id, name: `${lga.name} Ward ${i}` });
    }
  }
  const wards = await db.insert(wardsTable).values(wardSeed).returning();
  const ikejaWards = wards.filter((w) => w.lgaId === lagosLgas[0].id);
  const etiosaWards = wards.filter((w) => w.lgaId === lagosLgas[1].id);

  console.log("Seeding applications...");
  // Issued application (Tunde) -> certificate
  const [issuedApp] = await db
    .insert(applicationsTable)
    .values({
      tenantId: lagos.id,
      applicantId: applicant1.id,
      firstName: "Tunde",
      lastName: "Balogun",
      gender: "Male",
      dateOfBirth: "1990-04-12",
      nin: "12345678901",
      email: applicant1.email,
      phone: "+234 802 111 2222",
      residentialAddress: "14 Allen Avenue, Ikeja, Lagos",
      stateOfOrigin: "Lagos State",
      lgaId: lagosLgas[0].id,
      wardId: ikejaWards[0].id,
      fatherName: "Rasheed Balogun",
      motherName: "Sefiat Balogun",
      community: "Ikeja Indigenous Community",
      status: "issued",
      submittedAt: daysAgo(20),
      reviewedAt: daysAgo(18),
      reviewedById: officer1.id,
      createdAt: daysAgo(21),
    })
    .returning();

  await db.insert(documentsTable).values([
    { applicationId: issuedApp.id, name: "Birth Certificate", type: "birth_certificate", fileName: "birth-certificate.pdf", sizeKb: 240, uploadedAt: daysAgo(21) },
    { applicationId: issuedApp.id, name: "Passport Photograph", type: "photo", fileName: "passport.jpg", sizeKb: 120, uploadedAt: daysAgo(21) },
    { applicationId: issuedApp.id, name: "Letter of Attestation", type: "attestation", fileName: "attestation.pdf", sizeKb: 180, uploadedAt: daysAgo(21) },
  ]);
  await db.insert(paymentsTable).values({
    applicationId: issuedApp.id,
    tenantId: lagos.id,
    amount: "5000",
    currency: "NGN",
    reference: ref("PAY"),
    gateway: "Card",
    status: "success",
    payerName: "Tunde Balogun",
    receiptNumber: ref("RCPT"),
    paidAt: daysAgo(19),
  });
  await db.insert(certificatesTable).values({
    applicationId: issuedApp.id,
    tenantId: lagos.id,
    certificateNumber: `LAG/${new Date().getFullYear()}/00001`,
    applicantDisplayName: "Tunde Balogun",
    lgaName: "Ikeja",
    wardName: "Ikeja Ward 1",
    stateOfOrigin: "Lagos State",
    issueDate: daysAgo(18),
    status: "valid",
    issuedById: officer1.id,
    issuedByName: officer1.name,
  });

  // Paid application awaiting review (Ngozi)
  const [paidApp] = await db
    .insert(applicationsTable)
    .values({
      tenantId: lagos.id,
      applicantId: applicant2.id,
      firstName: "Ngozi",
      lastName: "Okwu",
      gender: "Female",
      dateOfBirth: "1995-09-30",
      nin: "23456789012",
      email: applicant2.email,
      phone: "+234 803 333 4444",
      residentialAddress: "5 Lekki Phase 1, Eti-Osa, Lagos",
      stateOfOrigin: "Lagos State",
      lgaId: lagosLgas[1].id,
      wardId: etiosaWards[0].id,
      fatherName: "Emeka Okwu",
      motherName: "Chioma Okwu",
      community: "Eti-Osa Community",
      status: "paid",
      submittedAt: daysAgo(3),
      createdAt: daysAgo(4),
    })
    .returning();
  await db.insert(documentsTable).values([
    { applicationId: paidApp.id, name: "Birth Certificate", type: "birth_certificate", fileName: "ngozi-birth.pdf", sizeKb: 210, uploadedAt: daysAgo(4) },
    { applicationId: paidApp.id, name: "Passport Photograph", type: "photo", fileName: "ngozi-passport.jpg", sizeKb: 110, uploadedAt: daysAgo(4) },
  ]);
  await db.insert(paymentsTable).values({
    applicationId: paidApp.id,
    tenantId: lagos.id,
    amount: "5000",
    currency: "NGN",
    reference: ref("PAY"),
    gateway: "Bank Transfer",
    status: "success",
    payerName: "Ngozi Okwu",
    receiptNumber: ref("RCPT"),
    paidAt: daysAgo(2),
  });

  // Draft application (Tunde, second application in progress)
  await db.insert(applicationsTable).values({
    tenantId: lagos.id,
    applicantId: applicant1.id,
    firstName: "Tunde",
    lastName: "Balogun",
    gender: "Male",
    dateOfBirth: "1990-04-12",
    nin: "12345678901",
    email: applicant1.email,
    phone: "+234 802 111 2222",
    residentialAddress: "14 Allen Avenue, Ikeja, Lagos",
    stateOfOrigin: "Lagos State",
    lgaId: lagosLgas[0].id,
    wardId: ikejaWards[1].id,
    status: "draft",
    createdAt: daysAgo(1),
  });

  // Rejected application (Ngozi)
  await db.insert(applicationsTable).values({
    tenantId: lagos.id,
    applicantId: applicant2.id,
    firstName: "Ngozi",
    lastName: "Okwu",
    gender: "Female",
    dateOfBirth: "1995-09-30",
    nin: "23456789012",
    email: applicant2.email,
    phone: "+234 803 333 4444",
    residentialAddress: "5 Lekki Phase 1, Eti-Osa, Lagos",
    stateOfOrigin: "Lagos State",
    lgaId: lagosLgas[1].id,
    wardId: etiosaWards[1].id,
    status: "rejected",
    rejectionReason: "Submitted birth certificate was illegible. Please re-upload a clear copy.",
    submittedAt: daysAgo(12),
    reviewedAt: daysAgo(10),
    reviewedById: officer2.id,
    createdAt: daysAgo(13),
  });

  // Kano paid application
  const [kanoApp] = await db
    .insert(applicationsTable)
    .values({
      tenantId: kano.id,
      applicantId: applicant1.id,
      firstName: "Musa",
      lastName: "Abdullahi",
      gender: "Male",
      dateOfBirth: "1988-01-20",
      nin: "34567890123",
      email: "musa@example.com",
      phone: "+234 805 555 6666",
      residentialAddress: "10 Zoo Road, Nassarawa, Kano",
      stateOfOrigin: "Kano State",
      lgaId: kanoLgas[0].id,
      wardId: wards.find((w) => w.lgaId === kanoLgas[0].id)!.id,
      fatherName: "Abdullahi Sule",
      motherName: "Hauwa Abdullahi",
      community: "Nassarawa Community",
      status: "paid",
      submittedAt: daysAgo(5),
      createdAt: daysAgo(6),
    })
    .returning();
  await db.insert(paymentsTable).values({
    applicationId: kanoApp.id,
    tenantId: kano.id,
    amount: "3500",
    currency: "NGN",
    reference: ref("PAY"),
    gateway: "Card",
    status: "success",
    payerName: "Musa Abdullahi",
    receiptNumber: ref("RCPT"),
    paidAt: daysAgo(4),
  });

  console.log("Seeding notifications...");
  await db.insert(notificationsTable).values([
    { userId: applicant1.id, applicationId: issuedApp.id, type: "approved", title: "Certificate issued", message: "Your indigene certificate LAG/" + new Date().getFullYear() + "/00001 has been issued.", read: false, createdAt: daysAgo(18) },
    { userId: applicant2.id, applicationId: paidApp.id, type: "payment", title: "Payment received", message: "We received your application fee. Your application is now awaiting review.", read: false, createdAt: daysAgo(2) },
  ]);

  console.log("Seeding audit log...");
  await db.insert(auditLogsTable).values([
    { tenantId: lagos.id, actorName: "Adaeze Okafor", actorRole: "super_admin", action: "Created tenant", recordType: "tenant", recordId: String(lagos.id), outcome: "success", detail: "Onboarded Lagos State", createdAt: daysAgo(40) },
    { tenantId: lagos.id, actorName: lagosAdmin.name, actorRole: "tenant_admin", action: "Added officer", recordType: "user", recordId: String(officer1.id), outcome: "success", detail: "Granted officer access to Chinedu Eze", createdAt: daysAgo(35) },
    { tenantId: lagos.id, actorName: "Tunde Balogun", actorRole: "applicant", action: "Submitted application", recordType: "application", recordId: String(issuedApp.id), outcome: "success", detail: "Application submitted, awaiting payment", createdAt: daysAgo(20) },
    { tenantId: lagos.id, actorName: "Tunde Balogun", actorRole: "applicant", action: "Paid application fee", recordType: "payment", recordId: String(issuedApp.id), outcome: "success", detail: "NGN 5,000 received", createdAt: daysAgo(19) },
    { tenantId: lagos.id, actorName: officer1.name, actorRole: "officer", action: "Approved application", recordType: "certificate", recordId: `LAG/${new Date().getFullYear()}/00001`, outcome: "issued", detail: "Issued certificate to Tunde Balogun", createdAt: daysAgo(18) },
    { tenantId: lagos.id, actorName: officer2.name, actorRole: "officer", action: "Rejected application", recordType: "application", recordId: "—", outcome: "rejected", detail: "Illegible birth certificate", createdAt: daysAgo(10) },
    { tenantId: kano.id, actorName: kanoOfficer.name, actorRole: "officer", action: "Reviewed queue", recordType: "application", recordId: String(kanoApp.id), outcome: "pending", detail: "Opened application for review", createdAt: daysAgo(3) },
  ]);

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
