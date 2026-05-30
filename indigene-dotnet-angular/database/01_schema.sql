/* =============================================================================
   Indigene Certificate System - SQL Server schema (T-SQL)
   File: 01_schema.sql

   RUN ORDER (in SSMS):
     1) Run this file (01_schema.sql) to create the database and all 10 tables.
     2) Then run 02_seed.sql to populate seed data.

   This script is re-runnable: it drops existing tables (in dependency order)
   before recreating them. Creates database IndigeneCertDb if it does not exist.
   ============================================================================= */

IF DB_ID('IndigeneCertDb') IS NULL
    CREATE DATABASE IndigeneCertDb;
GO

USE IndigeneCertDb;
GO

/* ---------------------------------------------------------------------------
   Drop existing tables in dependency order (children first).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
IF OBJECT_ID('dbo.audit_logs', 'U')   IS NOT NULL DROP TABLE dbo.audit_logs;
IF OBJECT_ID('dbo.certificates', 'U') IS NOT NULL DROP TABLE dbo.certificates;
IF OBJECT_ID('dbo.payments', 'U')     IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.documents', 'U')    IS NOT NULL DROP TABLE dbo.documents;
IF OBJECT_ID('dbo.applications', 'U') IS NOT NULL DROP TABLE dbo.applications;
IF OBJECT_ID('dbo.wards', 'U')        IS NOT NULL DROP TABLE dbo.wards;
IF OBJECT_ID('dbo.lgas', 'U')         IS NOT NULL DROP TABLE dbo.lgas;
IF OBJECT_ID('dbo.users', 'U')        IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.tenants', 'U')      IS NOT NULL DROP TABLE dbo.tenants;
GO

/* ---------------------------------------------------------------------------
   tenants
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.tenants (
    id                  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name                NVARCHAR(MAX)     NOT NULL,
    code                NVARCHAR(64)      NOT NULL,
    slug                NVARCHAR(256)     NOT NULL,
    certificate_prefix  NVARCHAR(64)      NOT NULL,
    fee                 DECIMAL(12,2)     NOT NULL CONSTRAINT DF_tenants_fee DEFAULT (0),
    currency            NVARCHAR(64)      NOT NULL CONSTRAINT DF_tenants_currency DEFAULT ('NGN'),
    status              NVARCHAR(64)      NOT NULL CONSTRAINT DF_tenants_status DEFAULT ('active'),
    contact_email       NVARCHAR(MAX)     NULL,
    contact_phone       NVARCHAR(MAX)     NULL,
    address             NVARCHAR(MAX)     NULL,
    capital             NVARCHAR(MAX)     NULL,
    logo_url            NVARCHAR(MAX)     NULL,
    primary_color       NVARCHAR(64)      NULL,
    tagline             NVARCHAR(MAX)     NULL,
    created_at          DATETIMEOFFSET    NOT NULL CONSTRAINT DF_tenants_created_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   users
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.users (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name        NVARCHAR(MAX)     NOT NULL,
    email       NVARCHAR(MAX)     NOT NULL,
    role        NVARCHAR(64)      NOT NULL,
    tenant_id   INT               NULL,
    status      NVARCHAR(64)      NOT NULL CONSTRAINT DF_users_status DEFAULT ('active'),
    created_at  DATETIMEOFFSET    NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   lgas
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.lgas (
    id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    tenant_id   INT               NOT NULL,
    name        NVARCHAR(MAX)     NOT NULL,
    code        NVARCHAR(64)      NULL
);
GO

/* ---------------------------------------------------------------------------
   wards
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.wards (
    id      INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    lga_id  INT               NOT NULL,
    name    NVARCHAR(MAX)     NOT NULL
);
GO

/* ---------------------------------------------------------------------------
   applications
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.applications (
    id                    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    tenant_id             INT               NOT NULL,
    applicant_id          INT               NOT NULL,
    first_name            NVARCHAR(MAX)     NULL,
    middle_name           NVARCHAR(MAX)     NULL,
    last_name             NVARCHAR(MAX)     NULL,
    gender                NVARCHAR(64)      NULL,
    date_of_birth         NVARCHAR(64)      NULL,
    nin                   NVARCHAR(64)      NULL,
    email                 NVARCHAR(MAX)     NULL,
    phone                 NVARCHAR(MAX)     NULL,
    residential_address   NVARCHAR(MAX)     NULL,
    state_of_origin       NVARCHAR(MAX)     NULL,
    lga_id                INT               NULL,
    ward_id               INT               NULL,
    father_name           NVARCHAR(MAX)     NULL,
    mother_name           NVARCHAR(MAX)     NULL,
    community             NVARCHAR(MAX)     NULL,
    status                NVARCHAR(64)      NOT NULL CONSTRAINT DF_applications_status DEFAULT ('draft'),
    rejection_reason      NVARCHAR(MAX)     NULL,
    submitted_at          DATETIMEOFFSET    NULL,
    reviewed_at           DATETIMEOFFSET    NULL,
    reviewed_by_id        INT               NULL,
    created_at            DATETIMEOFFSET    NOT NULL CONSTRAINT DF_applications_created_at DEFAULT (SYSDATETIMEOFFSET()),
    updated_at            DATETIMEOFFSET    NOT NULL CONSTRAINT DF_applications_updated_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   documents
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.documents (
    id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    application_id  INT               NOT NULL,
    name            NVARCHAR(MAX)     NOT NULL,
    type            NVARCHAR(64)      NOT NULL,
    file_name       NVARCHAR(MAX)     NOT NULL,
    size_kb         INT               NULL,
    uploaded_at     DATETIMEOFFSET    NOT NULL CONSTRAINT DF_documents_uploaded_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   payments
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.payments (
    id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    application_id  INT               NOT NULL,
    tenant_id       INT               NOT NULL,
    amount          DECIMAL(12,2)     NOT NULL CONSTRAINT DF_payments_amount DEFAULT (0),
    currency        NVARCHAR(64)      NOT NULL CONSTRAINT DF_payments_currency DEFAULT ('NGN'),
    reference       NVARCHAR(256)     NOT NULL,
    gateway         NVARCHAR(256)     NULL,
    status          NVARCHAR(64)      NOT NULL CONSTRAINT DF_payments_status DEFAULT ('success'),
    payer_name      NVARCHAR(MAX)     NULL,
    receipt_number  NVARCHAR(256)     NULL,
    paid_at         DATETIMEOFFSET    NOT NULL CONSTRAINT DF_payments_paid_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   certificates
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.certificates (
    id                       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    application_id           INT               NOT NULL,
    tenant_id                INT               NOT NULL,
    certificate_number       NVARCHAR(256)     NOT NULL,
    applicant_display_name   NVARCHAR(MAX)     NOT NULL,
    lga_name                 NVARCHAR(MAX)     NULL,
    ward_name                NVARCHAR(MAX)     NULL,
    state_of_origin          NVARCHAR(MAX)     NULL,
    issue_date               DATETIMEOFFSET    NOT NULL CONSTRAINT DF_certificates_issue_date DEFAULT (SYSDATETIMEOFFSET()),
    status                   NVARCHAR(64)      NOT NULL CONSTRAINT DF_certificates_status DEFAULT ('valid'),
    issued_by_id             INT               NULL,
    issued_by_name           NVARCHAR(MAX)     NULL,
    revoked_reason           NVARCHAR(MAX)     NULL
);
GO

/* ---------------------------------------------------------------------------
   audit_logs
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.audit_logs (
    id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    tenant_id    INT               NULL,
    actor_name   NVARCHAR(MAX)     NOT NULL,
    actor_role   NVARCHAR(64)      NULL,
    action       NVARCHAR(MAX)     NOT NULL,
    record_type  NVARCHAR(64)      NULL,
    record_id    NVARCHAR(256)     NULL,
    outcome      NVARCHAR(64)      NULL,
    detail       NVARCHAR(MAX)     NULL,
    created_at   DATETIMEOFFSET    NOT NULL CONSTRAINT DF_audit_logs_created_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

/* ---------------------------------------------------------------------------
   notifications
   --------------------------------------------------------------------------- */
CREATE TABLE dbo.notifications (
    id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id         INT               NOT NULL,
    application_id  INT               NULL,
    type            NVARCHAR(64)      NOT NULL,
    title           NVARCHAR(MAX)     NOT NULL,
    message         NVARCHAR(MAX)     NOT NULL,
    [read]          BIT               NOT NULL CONSTRAINT DF_notifications_read DEFAULT (0),
    created_at      DATETIMEOFFSET    NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT (SYSDATETIMEOFFSET())
);
GO

PRINT 'Schema created successfully. Next: run 02_seed.sql';
GO
