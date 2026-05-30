using IndigeneApi.Models;

namespace IndigeneApi.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        // Idempotent: only seed when the database has no tenants yet.
        if (db.Tenants.Any()) return;

        var now = DateTimeOffset.UtcNow;
        DateTimeOffset DaysAgo(int n) => now.AddDays(-n);
        var year = now.Year;

        // --- Tenants (3) ---
        var lagos = new Tenant
        {
            Name = "Lagos State", Code = "LA", Slug = "lagos", CertificatePrefix = "LAG",
            Fee = 5000m, Currency = "NGN", Status = "active",
            ContactEmail = "indigene@lagosstate.gov.ng", ContactPhone = "+234 1 700 0001",
            Address = "The Secretariat, Alausa, Ikeja, Lagos", Capital = "Ikeja",
            PrimaryColor = "#1f7a4d", Tagline = "Centre of Excellence", CreatedAt = DaysAgo(40),
        };
        var kano = new Tenant
        {
            Name = "Kano State", Code = "KN", Slug = "kano", CertificatePrefix = "KAN",
            Fee = 3500m, Currency = "NGN", Status = "active",
            ContactEmail = "indigene@kanostate.gov.ng", ContactPhone = "+234 64 700 0002",
            Address = "Government House, Kano", Capital = "Kano",
            PrimaryColor = "#0f5b8a", Tagline = "Centre of Commerce", CreatedAt = DaysAgo(40),
        };
        var enugu = new Tenant
        {
            Name = "Enugu State", Code = "EN", Slug = "enugu", CertificatePrefix = "ENU",
            Fee = 4000m, Currency = "NGN", Status = "suspended",
            ContactEmail = "indigene@enugustate.gov.ng", ContactPhone = "+234 42 700 0003",
            Address = "Government House, Independence Layout, Enugu", Capital = "Enugu",
            PrimaryColor = "#7a3b1f", Tagline = "Coal City State", CreatedAt = DaysAgo(40),
        };
        db.Tenants.AddRange(lagos, kano, enugu);
        db.SaveChanges();

        // --- Users (8) ---
        var superAdmin = new User { Name = "Adaeze Okafor", Email = "superadmin@indigene.gov.ng", Role = "super_admin", TenantId = null, Status = "active", CreatedAt = DaysAgo(40) };
        var lagosAdmin = new User { Name = "Bola Adeyemi", Email = "admin@lagosstate.gov.ng", Role = "tenant_admin", TenantId = lagos.Id, Status = "active", CreatedAt = DaysAgo(38) };
        var officer1 = new User { Name = "Chinedu Eze", Email = "officer1@lagosstate.gov.ng", Role = "officer", TenantId = lagos.Id, Status = "active", CreatedAt = DaysAgo(35) };
        var officer2 = new User { Name = "Funke Bello", Email = "officer2@lagosstate.gov.ng", Role = "officer", TenantId = lagos.Id, Status = "active", CreatedAt = DaysAgo(35) };
        var tunde = new User { Name = "Tunde Balogun", Email = "tunde@example.com", Role = "applicant", TenantId = lagos.Id, Status = "active", CreatedAt = DaysAgo(25) };
        var ngozi = new User { Name = "Ngozi Okwu", Email = "ngozi@example.com", Role = "applicant", TenantId = lagos.Id, Status = "active", CreatedAt = DaysAgo(22) };
        var kanoAdmin = new User { Name = "Ibrahim Sani", Email = "admin@kanostate.gov.ng", Role = "tenant_admin", TenantId = kano.Id, Status = "active", CreatedAt = DaysAgo(38) };
        var aisha = new User { Name = "Aisha Yusuf", Email = "officer@kanostate.gov.ng", Role = "officer", TenantId = kano.Id, Status = "active", CreatedAt = DaysAgo(35) };
        db.Users.AddRange(superAdmin, lagosAdmin, officer1, officer2, tunde, ngozi, kanoAdmin, aisha);
        db.SaveChanges();

        // --- Geography ---
        var lagosLgaNames = new[] { "Ikeja", "Eti-Osa", "Alimosho", "Surulere", "Badagry" };
        var kanoLgaNames = new[] { "Nassarawa", "Fagge", "Dala", "Gwale" };
        var lgaByName = new Dictionary<string, Lga>();

        foreach (var name in lagosLgaNames)
        {
            var lga = new Lga { TenantId = lagos.Id, Name = name, Code = null };
            db.Lgas.Add(lga);
            lgaByName[name] = lga;
        }
        foreach (var name in kanoLgaNames)
        {
            var lga = new Lga { TenantId = kano.Id, Name = name, Code = null };
            db.Lgas.Add(lga);
            lgaByName[name] = lga;
        }
        db.SaveChanges();

        var wardByKey = new Dictionary<string, Ward>();
        foreach (var lga in lgaByName.Values)
        {
            for (int i = 1; i <= 3; i++)
            {
                var ward = new Ward { LgaId = lga.Id, Name = $"{lga.Name} Ward {i}" };
                db.Wards.Add(ward);
                wardByKey[$"{lga.Name}|{i}"] = ward;
            }
        }
        db.SaveChanges();

        // --- Applications (5) ---
        // 1. Issued (Tunde, Lagos, Ikeja, Ikeja Ward 1)
        var app1 = new Application
        {
            TenantId = lagos.Id, ApplicantId = tunde.Id,
            FirstName = "Tunde", MiddleName = null, LastName = "Balogun",
            Gender = "Male", DateOfBirth = "1990-04-12", Nin = "12345678901",
            Email = "tunde@example.com", Phone = "+234 802 111 2222",
            ResidentialAddress = "14 Allen Avenue Ikeja", StateOfOrigin = "Lagos State",
            LgaId = lgaByName["Ikeja"].Id, WardId = wardByKey["Ikeja|1"].Id,
            FatherName = "Rasheed Balogun", MotherName = "Sefiat Balogun",
            Community = "Ikeja Indigenous Community", Status = "issued",
            SubmittedAt = DaysAgo(20), ReviewedAt = DaysAgo(18), ReviewedById = officer1.Id,
            CreatedAt = DaysAgo(21), UpdatedAt = DaysAgo(18),
        };
        // 2. Paid (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 1)
        var app2 = new Application
        {
            TenantId = lagos.Id, ApplicantId = ngozi.Id,
            FirstName = "Ngozi", MiddleName = null, LastName = "Okwu",
            Gender = "Female", DateOfBirth = "1995-09-30", Nin = "23456789012",
            Email = "ngozi@example.com", Phone = "+234 803 333 4444",
            ResidentialAddress = "5 Lekki Phase 1", StateOfOrigin = "Lagos State",
            LgaId = lgaByName["Eti-Osa"].Id, WardId = wardByKey["Eti-Osa|1"].Id,
            FatherName = "Emeka Okwu", MotherName = "Chioma Okwu",
            Community = "Eti-Osa Community", Status = "paid",
            SubmittedAt = DaysAgo(3), ReviewedAt = null, ReviewedById = null,
            CreatedAt = DaysAgo(4), UpdatedAt = DaysAgo(3),
        };
        // 3. Draft (Tunde 2nd app, Lagos, Ikeja, Ikeja Ward 2)
        var app3 = new Application
        {
            TenantId = lagos.Id, ApplicantId = tunde.Id,
            FirstName = "Tunde", MiddleName = null, LastName = "Balogun",
            Gender = "Male", DateOfBirth = "1990-04-12", Nin = "12345678901",
            Email = "tunde@example.com", Phone = "+234 802 111 2222",
            ResidentialAddress = "14 Allen Avenue Ikeja", StateOfOrigin = "Lagos State",
            LgaId = lgaByName["Ikeja"].Id, WardId = wardByKey["Ikeja|2"].Id,
            FatherName = "Rasheed Balogun", MotherName = "Sefiat Balogun",
            Community = "Ikeja Indigenous Community", Status = "draft",
            CreatedAt = DaysAgo(1), UpdatedAt = DaysAgo(1),
        };
        // 4. Rejected (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 2)
        var app4 = new Application
        {
            TenantId = lagos.Id, ApplicantId = ngozi.Id,
            FirstName = "Ngozi", MiddleName = null, LastName = "Okwu",
            Gender = "Female", DateOfBirth = "1995-09-30", Nin = "23456789012",
            Email = "ngozi@example.com", Phone = "+234 803 333 4444",
            ResidentialAddress = "5 Lekki Phase 1", StateOfOrigin = "Lagos State",
            LgaId = lgaByName["Eti-Osa"].Id, WardId = wardByKey["Eti-Osa|2"].Id,
            FatherName = "Emeka Okwu", MotherName = "Chioma Okwu",
            Community = "Eti-Osa Community", Status = "rejected",
            RejectionReason = "Submitted birth certificate was illegible. Please re-upload a clear copy.",
            SubmittedAt = DaysAgo(12), ReviewedAt = DaysAgo(10), ReviewedById = officer2.Id,
            CreatedAt = DaysAgo(13), UpdatedAt = DaysAgo(10),
        };
        // 5. Paid (Kano, applicant = Tunde's user id, Nassarawa, Nassarawa Ward 1)
        var app5 = new Application
        {
            TenantId = kano.Id, ApplicantId = tunde.Id,
            FirstName = "Musa", MiddleName = null, LastName = "Abdullahi",
            Gender = "Male", DateOfBirth = "1988-01-20", Nin = "34567890123",
            Email = "musa@example.com", Phone = "+234 805 555 6666",
            ResidentialAddress = "10 Zoo Road Nassarawa", StateOfOrigin = "Kano State",
            LgaId = lgaByName["Nassarawa"].Id, WardId = wardByKey["Nassarawa|1"].Id,
            FatherName = "Abdullahi Sule", MotherName = "Hauwa Abdullahi",
            Community = "Nassarawa Community", Status = "paid",
            SubmittedAt = DaysAgo(5), ReviewedAt = null, ReviewedById = null,
            CreatedAt = DaysAgo(6), UpdatedAt = DaysAgo(5),
        };
        db.Applications.AddRange(app1, app2, app3, app4, app5);
        db.SaveChanges();

        // --- Documents ---
        db.Documents.AddRange(
            new Document { ApplicationId = app1.Id, Name = "Birth Certificate", Type = "birth_certificate", FileName = "birth-certificate.pdf", SizeKb = 240, UploadedAt = DaysAgo(21) },
            new Document { ApplicationId = app1.Id, Name = "Passport Photograph", Type = "photo", FileName = "passport.jpg", SizeKb = 120, UploadedAt = DaysAgo(21) },
            new Document { ApplicationId = app1.Id, Name = "Letter of Attestation", Type = "attestation", FileName = "attestation.pdf", SizeKb = 180, UploadedAt = DaysAgo(21) },
            new Document { ApplicationId = app2.Id, Name = "Birth Certificate", Type = "birth_certificate", FileName = "ngozi-birth.pdf", SizeKb = 210, UploadedAt = DaysAgo(4) },
            new Document { ApplicationId = app2.Id, Name = "Passport Photograph", Type = "photo", FileName = "ngozi-passport.jpg", SizeKb = 110, UploadedAt = DaysAgo(4) }
        );

        // --- Payments ---
        db.Payments.AddRange(
            new Payment { ApplicationId = app1.Id, TenantId = lagos.Id, Amount = 5000m, Currency = "NGN", Reference = "PAY-SEED-0001", Gateway = "Card", Status = "success", PayerName = "Tunde Balogun", ReceiptNumber = "RCPT-SEED-0001", PaidAt = DaysAgo(19) },
            new Payment { ApplicationId = app2.Id, TenantId = lagos.Id, Amount = 5000m, Currency = "NGN", Reference = "PAY-SEED-0002", Gateway = "Bank Transfer", Status = "success", PayerName = "Ngozi Okwu", ReceiptNumber = "RCPT-SEED-0002", PaidAt = DaysAgo(2) },
            new Payment { ApplicationId = app5.Id, TenantId = kano.Id, Amount = 3500m, Currency = "NGN", Reference = "PAY-SEED-0003", Gateway = "Card", Status = "success", PayerName = "Musa Abdullahi", ReceiptNumber = "RCPT-SEED-0003", PaidAt = DaysAgo(4) }
        );

        // --- Certificates ---
        var certNumber = $"LAG/{year}/{app1.Id.ToString().PadLeft(5, '0')}";
        db.Certificates.Add(new Certificate
        {
            ApplicationId = app1.Id, TenantId = lagos.Id, CertificateNumber = certNumber,
            ApplicantDisplayName = "Tunde Balogun", LgaName = "Ikeja", WardName = "Ikeja Ward 1",
            StateOfOrigin = "Lagos State", IssueDate = DaysAgo(18), Status = "valid",
            IssuedById = officer1.Id, IssuedByName = officer1.Name, RevokedReason = null,
        });

        // --- Notifications (2) ---
        db.Notifications.AddRange(
            new Notification { UserId = tunde.Id, ApplicationId = app1.Id, Type = "approved", Title = "Certificate issued", Message = $"Your indigene certificate {certNumber} has been issued.", Read = false, CreatedAt = DaysAgo(18) },
            new Notification { UserId = ngozi.Id, ApplicationId = app2.Id, Type = "payment", Title = "Payment received", Message = "We received your application fee. Your application is now awaiting review.", Read = false, CreatedAt = DaysAgo(2) }
        );

        // --- Audit logs (7) ---
        db.AuditLogs.AddRange(
            new AuditLog { TenantId = lagos.Id, ActorName = "Platform Super Admin", ActorRole = "super_admin", Action = "Created tenant", RecordType = "tenant", RecordId = lagos.Id.ToString(), Outcome = "success", Detail = "Onboarded Lagos State", CreatedAt = DaysAgo(40) },
            new AuditLog { TenantId = lagos.Id, ActorName = "Administrator", ActorRole = "tenant_admin", Action = "Added officer", RecordType = "user", RecordId = officer1.Id.ToString(), Outcome = "success", Detail = "Granted officer access to Chinedu Eze", CreatedAt = DaysAgo(35) },
            new AuditLog { TenantId = lagos.Id, ActorName = "Tunde Balogun", ActorRole = "applicant", Action = "Submitted application", RecordType = "application", RecordId = app1.Id.ToString(), Outcome = "success", Detail = "Application submitted, awaiting payment", CreatedAt = DaysAgo(20) },
            new AuditLog { TenantId = lagos.Id, ActorName = "Tunde Balogun", ActorRole = "applicant", Action = "Paid application fee", RecordType = "payment", RecordId = app1.Id.ToString(), Outcome = "success", Detail = "NGN 5,000 received", CreatedAt = DaysAgo(19) },
            new AuditLog { TenantId = lagos.Id, ActorName = "Chinedu Eze", ActorRole = "officer", Action = "Approved application", RecordType = "certificate", RecordId = certNumber, Outcome = "issued", Detail = "Issued certificate to Tunde Balogun", CreatedAt = DaysAgo(18) },
            new AuditLog { TenantId = lagos.Id, ActorName = "Funke Bello", ActorRole = "officer", Action = "Rejected application", RecordType = "application", RecordId = "—", Outcome = "rejected", Detail = "Illegible birth certificate", CreatedAt = DaysAgo(10) },
            new AuditLog { TenantId = kano.Id, ActorName = "Aisha Yusuf", ActorRole = "officer", Action = "Reviewed queue", RecordType = "application", RecordId = app5.Id.ToString(), Outcome = "pending", Detail = "Opened application for review", CreatedAt = DaysAgo(3) }
        );

        db.SaveChanges();
    }
}
