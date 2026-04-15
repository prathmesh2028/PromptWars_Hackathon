#!/usr/bin/env pwsh
# ============================================================
#  SmartVenue AI — Unified Cloud Run Deployment Script
#  One-command deploy for the consolidated monorepo.
#
#  Usage:  .\deploy-cloudrun.ps1 -ProjectId "your-project-id"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region = "asia-south1",
    [string]$JwtSecret = ""
)

$ErrorActionPreference = "Stop"

# ── Colours ────────────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fatal { param($msg) Write-Host "`n[FATAL] $msg" -ForegroundColor Red; exit 1 }

Write-Host @"

╔══════════════════════════════════════════════════╗
║   SmartVenue AI — Unified Deployment Script       ║
╚══════════════════════════════════════════════════╝

  Project : $ProjectId
  Region  : $Region

"@ -ForegroundColor Magenta

# ── Validate prerequisites ─────────────────────────────────────────────────────
Write-Step "Checking gcloud CLI..."

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Fatal "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
}
Write-Ok "gcloud CLI found"

# ── Configure gcloud ───────────────────────────────────────────────────────────
Write-Step "Setting GCP project..."
gcloud config set project $ProjectId
Write-Ok "Project set"

# ── Enable required APIs ───────────────────────────────────────────────────────
Write-Step "Enabling required APIs..."
$apis = @(
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com"
)
foreach ($api in $apis) {
    gcloud services enable $api --project=$ProjectId | Out-Null
    Write-Ok "$api enabled"
}

# ── JWT Secret handling ───────────────────────────────────────────────────────
if ($JwtSecret -eq "") {
    Write-Warn "No JWT secret provided, generating one..."
    $JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object { [char]$_ })
    Write-Warn "Generated JWT_SECRET: $JwtSecret"
}

# ── Build with Cloud Build ────────────────────────────────────────────────────
Write-Step "Building Docker image using Cloud Build..."
$timestamp = Get-Date -Format "yyyyMMddHHmm"
$imageTag = "gcr.io/$ProjectId/smartvenue:$timestamp"

gcloud builds submit --tag $imageTag --project=$ProjectId .

if ($LASTEXITCODE -ne 0) {
    Write-Fatal "Build failed"
}

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
Write-Step "Deploying to Cloud Run..."
gcloud run deploy smartvenue `
    --image=$imageTag `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --min-instances=0 `
    --max-instances=5 `
    --memory=1Gi `
    --cpu=1 `
    --timeout=300 `
    --port=8080 `
    --session-affinity `
    --set-env-vars="NODE_ENV=production,JWT_SECRET=$JwtSecret,JWT_EXPIRY=7d,FRONTEND_URL=same-origin" `
    --project=$ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Fatal "Deployment failed"
}

# ── Fetch URL ────────────────────────────────────────────────────────────────
Write-Step "Fetching service URL..."
$serviceUrl = gcloud run services describe smartvenue --region=$Region --format="value(status.url)" --project=$ProjectId

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host @"

============================================================
  DEPLOYMENT COMPLETE
  Dedicated to Cloud Run service [smartvenue] in project [$ProjectId] region [$Region]
  URL: $serviceUrl
============================================================
"@ -ForegroundColor Green