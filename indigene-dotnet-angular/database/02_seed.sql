/* =============================================================================
   Indigene Certificate System - SQL Server seed data (T-SQL)
   File: 02_seed.sql

   RUN ORDER (in SSMS):
     1) Run 01_schema.sql FIRST to create the database and tables.
     2) Then run this file (02_seed.sql) to populate seed data.

   This script is re-runnable: it clears all tables (DELETE in dependency order)
   and reseeds IDENTITY back to 0 so ids restart at 1 on each run.
   Dates are relative to "today" via DATEADD(day, -N, SYSDATETIMEOFFSET()).
   ============================================================================= */

USE IndigeneCertDb;
GO

SET NOCOUNT ON;
GO

/* ---------------------------------------------------------------------------
   Clear all tables in dependency order, then reseed IDENTITY to 0.
   --------------------------------------------------------------------------- */
DELETE FROM dbo.notifications;
DELETE FROM dbo.audit_logs;
DELETE FROM dbo.certificates;
DELETE FROM dbo.payments;
DELETE FROM dbo.documents;
DELETE FROM dbo.applications;
DELETE FROM dbo.wards;
DELETE FROM dbo.lgas;
DELETE FROM dbo.users;
DELETE FROM dbo.tenants;
GO

DBCC CHECKIDENT ('dbo.notifications', RESEED, 0);
DBCC CHECKIDENT ('dbo.audit_logs',   RESEED, 0);
DBCC CHECKIDENT ('dbo.certificates', RESEED, 0);
DBCC CHECKIDENT ('dbo.payments',     RESEED, 0);
DBCC CHECKIDENT ('dbo.documents',    RESEED, 0);
DBCC CHECKIDENT ('dbo.applications', RESEED, 0);
DBCC CHECKIDENT ('dbo.wards',        RESEED, 0);
DBCC CHECKIDENT ('dbo.lgas',         RESEED, 0);
DBCC CHECKIDENT ('dbo.users',        RESEED, 0);
DBCC CHECKIDENT ('dbo.tenants',      RESEED, 0);
GO

DECLARE @year NVARCHAR(8) = CAST(YEAR(SYSDATETIMEOFFSET()) AS NVARCHAR(8));
DECLARE @certNumber NVARCHAR(256);

/* =============================================================================
   1. Tenants (3)
   ============================================================================= */
DECLARE @lagosId INT, @kanoId INT, @enuguId INT;

INSERT INTO dbo.tenants (name, code, slug, certificate_prefix, fee, currency, status,
    contact_email, contact_phone, address, capital, primary_color, tagline, created_at)
VALUES (N'Lagos State', N'LA', N'lagos', N'LAG', 5000, N'NGN', N'active',
    N'indigene@lagosstate.gov.ng', N'+234 1 700 0001', N'The Secretariat, Alausa, Ikeja, Lagos',
    N'Ikeja', N'#1f7a4d', N'Centre of Excellence', SYSDATETIMEOFFSET());
SET @lagosId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.tenants (name, code, slug, certificate_prefix, fee, currency, status,
    contact_email, contact_phone, address, capital, primary_color, tagline, created_at)
VALUES (N'Kano State', N'KN', N'kano', N'KAN', 3500, N'NGN', N'active',
    N'indigene@kanostate.gov.ng', N'+234 64 700 0002', N'Government House, Kano',
    N'Kano', N'#0f5b8a', N'Centre of Commerce', SYSDATETIMEOFFSET());
SET @kanoId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.tenants (name, code, slug, certificate_prefix, fee, currency, status,
    contact_email, contact_phone, address, capital, primary_color, tagline, created_at)
VALUES (N'Enugu State', N'EN', N'enugu', N'ENU', 4000, N'NGN', N'suspended',
    N'indigene@enugustate.gov.ng', N'+234 42 700 0003', N'Government House, Independence Layout, Enugu',
    N'Enugu', N'#7a3b1f', N'Coal City State', SYSDATETIMEOFFSET());
SET @enuguId = CAST(SCOPE_IDENTITY() AS INT);

/* =============================================================================
   2. Users (8)
   ============================================================================= */
DECLARE @superAdminId INT, @lagosAdminId INT, @officer1Id INT, @officer2Id INT,
        @applicant1Id INT, @applicant2Id INT, @kanoAdminId INT, @kanoOfficerId INT;

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Adaeze Okafor', N'superadmin@indigene.gov.ng', N'super_admin', NULL, N'active', SYSDATETIMEOFFSET());
SET @superAdminId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Bola Adeyemi', N'admin@lagosstate.gov.ng', N'tenant_admin', @lagosId, N'active', SYSDATETIMEOFFSET());
SET @lagosAdminId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Chinedu Eze', N'officer1@lagosstate.gov.ng', N'officer', @lagosId, N'active', SYSDATETIMEOFFSET());
SET @officer1Id = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Funke Bello', N'officer2@lagosstate.gov.ng', N'officer', @lagosId, N'active', SYSDATETIMEOFFSET());
SET @officer2Id = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Tunde Balogun', N'tunde@example.com', N'applicant', @lagosId, N'active', SYSDATETIMEOFFSET());
SET @applicant1Id = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Ngozi Okwu', N'ngozi@example.com', N'applicant', @lagosId, N'active', SYSDATETIMEOFFSET());
SET @applicant2Id = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Ibrahim Sani', N'admin@kanostate.gov.ng', N'tenant_admin', @kanoId, N'active', SYSDATETIMEOFFSET());
SET @kanoAdminId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.users (name, email, role, tenant_id, status, created_at)
VALUES (N'Aisha Yusuf', N'officer@kanostate.gov.ng', N'officer', @kanoId, N'active', SYSDATETIMEOFFSET());
SET @kanoOfficerId = CAST(SCOPE_IDENTITY() AS INT);

/* =============================================================================
   3. Geography - LGAs and Wards
     Lagos LGAs: Ikeja, Eti-Osa, Alimosho, Surulere, Badagry
     Kano LGAs:  Nassarawa, Fagge, Dala, Gwale
     Each LGA gets 3 wards "<LGA> Ward 1..3".
   ============================================================================= */
DECLARE @ikejaId INT, @etiosaId INT, @alimoshoId INT, @surulereId INT, @badagryId INT;
DECLARE @nassarawaId INT, @faggeId INT, @dalaId INT, @gwaleId INT;

INSERT INTO dbo.lgas (tenant_id, name) VALUES (@lagosId, N'Ikeja');
SET @ikejaId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@lagosId, N'Eti-Osa');
SET @etiosaId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@lagosId, N'Alimosho');
SET @alimoshoId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@lagosId, N'Surulere');
SET @surulereId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@lagosId, N'Badagry');
SET @badagryId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.lgas (tenant_id, name) VALUES (@kanoId, N'Nassarawa');
SET @nassarawaId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@kanoId, N'Fagge');
SET @faggeId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@kanoId, N'Dala');
SET @dalaId = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.lgas (tenant_id, name) VALUES (@kanoId, N'Gwale');
SET @gwaleId = CAST(SCOPE_IDENTITY() AS INT);

/* Wards: 3 per LGA. Capture the specific wards referenced by applications. */
DECLARE @ikejaWard1Id INT, @ikejaWard2Id INT;
DECLARE @etiosaWard1Id INT, @etiosaWard2Id INT;
DECLARE @nassarawaWard1Id INT;

INSERT INTO dbo.wards (lga_id, name) VALUES (@ikejaId, N'Ikeja Ward 1');
SET @ikejaWard1Id = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.wards (lga_id, name) VALUES (@ikejaId, N'Ikeja Ward 2');
SET @ikejaWard2Id = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.wards (lga_id, name) VALUES (@ikejaId, N'Ikeja Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@etiosaId, N'Eti-Osa Ward 1');
SET @etiosaWard1Id = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.wards (lga_id, name) VALUES (@etiosaId, N'Eti-Osa Ward 2');
SET @etiosaWard2Id = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.wards (lga_id, name) VALUES (@etiosaId, N'Eti-Osa Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@alimoshoId, N'Alimosho Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@alimoshoId, N'Alimosho Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@alimoshoId, N'Alimosho Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@surulereId, N'Surulere Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@surulereId, N'Surulere Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@surulereId, N'Surulere Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@badagryId, N'Badagry Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@badagryId, N'Badagry Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@badagryId, N'Badagry Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@nassarawaId, N'Nassarawa Ward 1');
SET @nassarawaWard1Id = CAST(SCOPE_IDENTITY() AS INT);
INSERT INTO dbo.wards (lga_id, name) VALUES (@nassarawaId, N'Nassarawa Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@nassarawaId, N'Nassarawa Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@faggeId, N'Fagge Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@faggeId, N'Fagge Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@faggeId, N'Fagge Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@dalaId, N'Dala Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@dalaId, N'Dala Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@dalaId, N'Dala Ward 3');

INSERT INTO dbo.wards (lga_id, name) VALUES (@gwaleId, N'Gwale Ward 1');
INSERT INTO dbo.wards (lga_id, name) VALUES (@gwaleId, N'Gwale Ward 2');
INSERT INTO dbo.wards (lga_id, name) VALUES (@gwaleId, N'Gwale Ward 3');

/* =============================================================================
   4. Applications (5)
   ============================================================================= */
DECLARE @issuedAppId INT, @paidAppId INT, @draftAppId INT, @rejectedAppId INT, @kanoAppId INT;

/* App 1: Issued (Tunde, Lagos, Ikeja, Ikeja Ward 1) */
INSERT INTO dbo.applications (tenant_id, applicant_id, first_name, last_name, gender,
    date_of_birth, nin, email, phone, residential_address, state_of_origin, lga_id, ward_id,
    father_name, mother_name, community, status, submitted_at, reviewed_at, reviewed_by_id,
    created_at, updated_at)
VALUES (@lagosId, @applicant1Id, N'Tunde', N'Balogun', N'Male',
    N'1990-04-12', N'12345678901', N'tunde@example.com', N'+234 802 111 2222',
    N'14 Allen Avenue, Ikeja, Lagos', N'Lagos State', @ikejaId, @ikejaWard1Id,
    N'Rasheed Balogun', N'Sefiat Balogun', N'Ikeja Indigenous Community', N'issued',
    DATEADD(day, -20, SYSDATETIMEOFFSET()), DATEADD(day, -18, SYSDATETIMEOFFSET()), @officer1Id,
    DATEADD(day, -21, SYSDATETIMEOFFSET()), DATEADD(day, -18, SYSDATETIMEOFFSET()));
SET @issuedAppId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.documents (application_id, name, type, file_name, size_kb, uploaded_at)
VALUES (@issuedAppId, N'Birth Certificate', N'birth_certificate', N'birth-certificate.pdf', 240, DATEADD(day, -21, SYSDATETIMEOFFSET())),
       (@issuedAppId, N'Passport Photograph', N'photo', N'passport.jpg', 120, DATEADD(day, -21, SYSDATETIMEOFFSET())),
       (@issuedAppId, N'Letter of Attestation', N'attestation', N'attestation.pdf', 180, DATEADD(day, -21, SYSDATETIMEOFFSET()));

INSERT INTO dbo.payments (application_id, tenant_id, amount, currency, reference, gateway, status, payer_name, receipt_number, paid_at)
VALUES (@issuedAppId, @lagosId, 5000, N'NGN',
    N'PAY-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    N'Card', N'success', N'Tunde Balogun',
    N'RCPT-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    DATEADD(day, -19, SYSDATETIMEOFFSET()));

SET @certNumber = N'LAG/' + @year + N'/00001';
INSERT INTO dbo.certificates (application_id, tenant_id, certificate_number, applicant_display_name,
    lga_name, ward_name, state_of_origin, issue_date, status, issued_by_id, issued_by_name)
VALUES (@issuedAppId, @lagosId, @certNumber, N'Tunde Balogun',
    N'Ikeja', N'Ikeja Ward 1', N'Lagos State', DATEADD(day, -18, SYSDATETIMEOFFSET()),
    N'valid', @officer1Id, N'Chinedu Eze');

/* App 2: Paid (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 1) */
INSERT INTO dbo.applications (tenant_id, applicant_id, first_name, last_name, gender,
    date_of_birth, nin, email, phone, residential_address, state_of_origin, lga_id, ward_id,
    father_name, mother_name, community, status, submitted_at, created_at, updated_at)
VALUES (@lagosId, @applicant2Id, N'Ngozi', N'Okwu', N'Female',
    N'1995-09-30', N'23456789012', N'ngozi@example.com', N'+234 803 333 4444',
    N'5 Lekki Phase 1, Eti-Osa, Lagos', N'Lagos State', @etiosaId, @etiosaWard1Id,
    N'Emeka Okwu', N'Chioma Okwu', N'Eti-Osa Community', N'paid',
    DATEADD(day, -3, SYSDATETIMEOFFSET()), DATEADD(day, -4, SYSDATETIMEOFFSET()), DATEADD(day, -3, SYSDATETIMEOFFSET()));
SET @paidAppId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.documents (application_id, name, type, file_name, size_kb, uploaded_at)
VALUES (@paidAppId, N'Birth Certificate', N'birth_certificate', N'ngozi-birth.pdf', 210, DATEADD(day, -4, SYSDATETIMEOFFSET())),
       (@paidAppId, N'Passport Photograph', N'photo', N'ngozi-passport.jpg', 110, DATEADD(day, -4, SYSDATETIMEOFFSET()));

INSERT INTO dbo.payments (application_id, tenant_id, amount, currency, reference, gateway, status, payer_name, receipt_number, paid_at)
VALUES (@paidAppId, @lagosId, 5000, N'NGN',
    N'PAY-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    N'Bank Transfer', N'success', N'Ngozi Okwu',
    N'RCPT-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    DATEADD(day, -2, SYSDATETIMEOFFSET()));

/* App 3: Draft (Tunde 2nd app, Lagos, Ikeja, Ikeja Ward 2) */
INSERT INTO dbo.applications (tenant_id, applicant_id, first_name, last_name, gender,
    date_of_birth, nin, email, phone, residential_address, state_of_origin, lga_id, ward_id,
    status, created_at, updated_at)
VALUES (@lagosId, @applicant1Id, N'Tunde', N'Balogun', N'Male',
    N'1990-04-12', N'12345678901', N'tunde@example.com', N'+234 802 111 2222',
    N'14 Allen Avenue, Ikeja, Lagos', N'Lagos State', @ikejaId, @ikejaWard2Id,
    N'draft', DATEADD(day, -1, SYSDATETIMEOFFSET()), DATEADD(day, -1, SYSDATETIMEOFFSET()));
SET @draftAppId = CAST(SCOPE_IDENTITY() AS INT);

/* App 4: Rejected (Ngozi, Lagos, Eti-Osa, Eti-Osa Ward 2) */
INSERT INTO dbo.applications (tenant_id, applicant_id, first_name, last_name, gender,
    date_of_birth, nin, email, phone, residential_address, state_of_origin, lga_id, ward_id,
    father_name, mother_name, community, status, rejection_reason, submitted_at, reviewed_at,
    reviewed_by_id, created_at, updated_at)
VALUES (@lagosId, @applicant2Id, N'Ngozi', N'Okwu', N'Female',
    N'1995-09-30', N'23456789012', N'ngozi@example.com', N'+234 803 333 4444',
    N'5 Lekki Phase 1, Eti-Osa, Lagos', N'Lagos State', @etiosaId, @etiosaWard2Id,
    N'Emeka Okwu', N'Chioma Okwu', N'Eti-Osa Community', N'rejected',
    N'Submitted birth certificate was illegible. Please re-upload a clear copy.',
    DATEADD(day, -12, SYSDATETIMEOFFSET()), DATEADD(day, -10, SYSDATETIMEOFFSET()), @officer2Id,
    DATEADD(day, -13, SYSDATETIMEOFFSET()), DATEADD(day, -10, SYSDATETIMEOFFSET()));
SET @rejectedAppId = CAST(SCOPE_IDENTITY() AS INT);

/* App 5: Paid (Kano, applicant = Tunde's user id, Nassarawa, Nassarawa Ward 1) */
INSERT INTO dbo.applications (tenant_id, applicant_id, first_name, last_name, gender,
    date_of_birth, nin, email, phone, residential_address, state_of_origin, lga_id, ward_id,
    father_name, mother_name, community, status, submitted_at, created_at, updated_at)
VALUES (@kanoId, @applicant1Id, N'Musa', N'Abdullahi', N'Male',
    N'1988-01-20', N'34567890123', N'musa@example.com', N'+234 805 555 6666',
    N'10 Zoo Road, Nassarawa, Kano', N'Kano State', @nassarawaId, @nassarawaWard1Id,
    N'Abdullahi Sule', N'Hauwa Abdullahi', N'Nassarawa Community', N'paid',
    DATEADD(day, -5, SYSDATETIMEOFFSET()), DATEADD(day, -6, SYSDATETIMEOFFSET()), DATEADD(day, -5, SYSDATETIMEOFFSET()));
SET @kanoAppId = CAST(SCOPE_IDENTITY() AS INT);

INSERT INTO dbo.payments (application_id, tenant_id, amount, currency, reference, gateway, status, payer_name, receipt_number, paid_at)
VALUES (@kanoAppId, @kanoId, 3500, N'NGN',
    N'PAY-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    N'Card', N'success', N'Musa Abdullahi',
    N'RCPT-' + UPPER(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', '')),
    DATEADD(day, -4, SYSDATETIMEOFFSET()));

/* =============================================================================
   5. Notifications (2)
   ============================================================================= */
INSERT INTO dbo.notifications (user_id, application_id, type, title, message, [read], created_at)
VALUES (@applicant1Id, @issuedAppId, N'approved', N'Certificate issued',
    N'Your indigene certificate LAG/' + @year + N'/00001 has been issued.', 0,
    DATEADD(day, -18, SYSDATETIMEOFFSET()));

INSERT INTO dbo.notifications (user_id, application_id, type, title, message, [read], created_at)
VALUES (@applicant2Id, @paidAppId, N'payment', N'Payment received',
    N'We received your application fee. Your application is now awaiting review.', 0,
    DATEADD(day, -2, SYSDATETIMEOFFSET()));

/* =============================================================================
   6. Audit logs (7)
   ============================================================================= */
INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Adaeze Okafor', N'super_admin', N'Created tenant', N'tenant',
    CAST(@lagosId AS NVARCHAR(256)), N'success', N'Onboarded Lagos State', DATEADD(day, -40, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Bola Adeyemi', N'tenant_admin', N'Added officer', N'user',
    CAST(@officer1Id AS NVARCHAR(256)), N'success', N'Granted officer access to Chinedu Eze', DATEADD(day, -35, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Tunde Balogun', N'applicant', N'Submitted application', N'application',
    CAST(@issuedAppId AS NVARCHAR(256)), N'success', N'Application submitted, awaiting payment', DATEADD(day, -20, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Tunde Balogun', N'applicant', N'Paid application fee', N'payment',
    CAST(@issuedAppId AS NVARCHAR(256)), N'success', N'NGN 5,000 received', DATEADD(day, -19, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Chinedu Eze', N'officer', N'Approved application', N'certificate',
    N'LAG/' + @year + N'/00001', N'issued', N'Issued certificate to Tunde Balogun', DATEADD(day, -18, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@lagosId, N'Funke Bello', N'officer', N'Rejected application', N'application',
    N'—', N'rejected', N'Illegible birth certificate', DATEADD(day, -10, SYSDATETIMEOFFSET()));

INSERT INTO dbo.audit_logs (tenant_id, actor_name, actor_role, action, record_type, record_id, outcome, detail, created_at)
VALUES (@kanoId, N'Aisha Yusuf', N'officer', N'Reviewed queue', N'application',
    CAST(@kanoAppId AS NVARCHAR(256)), N'pending', N'Opened application for review', DATEADD(day, -3, SYSDATETIMEOFFSET()));
GO

PRINT 'Seed data inserted successfully.';
GO
