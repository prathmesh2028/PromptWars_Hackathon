#!/usr/bin/env pwsh
# ============================================================
#  SmartVenue AI — Google Cloud Run Deployment Script
#  Usage:  .\deploy-cloudrun.ps1 -ProjectId "your-project-id"
#
#  Prerequisites:
#    - gcloud CLI installed and authenticated
#    - Docker Desktop running
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region = "us-central1",
    [string]$JwtSecret = "",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# ── Colours ────────────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fatal { param($msg) Write-Host "`n✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host @"

╔══════════════════════════════════════════════════╗
║   SmartVenue AI — Cloud Run Deployment Script    ║
╚══════════════════════════════════════════════════╝

  Project : $ProjectId
  Region  : $Region

"@ -ForegroundColor Magenta

# ── Validate prerequisites ─────────────────────────────────────────────────────
Write-Step "Checking prerequisites..."

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Fatal "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fatal "Docker not found. Install: https://docs.docker.com/get-docker/"
}
Write-Ok "gcloud and Docker found"

# ── Configure gcloud ───────────────────────────────────────────────────────────
Write-Step "Configuring gcloud project..."
gcloud config set project $ProjectId
Write-Ok "Active project set to: $ProjectId"

# ── Enable required APIs ───────────────────────────────────────────────────────
Write-Step "Enabling required GCP APIs (this may take ~60s first time)..."
$apis = @(
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com"
)
foreach ($api in $apis) {
    gcloud services enable $api --project=$ProjectId | Out-Null
    Write-Ok $api
}

# ── Configure Docker for GCR ──────────────────────────────────────────────────
Write-Step "Authenticating Docker with Google Container Registry..."
gcloud auth configure-docker --quiet
Write-Ok "Docker configured for gcr.io"

# ── Image names ───────────────────────────────────────────────────────────────
$timestamp  = Get-Date -Format "yyyyMMddHHmm"
$backendImg = "gcr.io/$ProjectId/smartvenue-backend:$timestamp"
$frontendImg = "gcr.io/$ProjectId/smartvenue-frontend:$timestamp"

# ════════════════════════════════════════════════════════════════════════════════
#  BACKEND
# ════════════════════════════════════════════════════════════════════════════════

Write-Step "Building backend Docker image..."
if (-not $SkipBuild) {
    docker build -t $backendImg -t "gcr.io/$ProjectId/smartvenue-backend:latest" ./backend
    Write-Ok "Backend image built: $backendImg"
} else {
    Write-Warn "Skipping build (--SkipBuild flag set)"
}

Write-Step "Pushing backend image to GCR..."
docker push $backendImg
docker push "gcr.io/$ProjectId/smartvenue-backend:latest"
Write-Ok "Backend image pushed"

# ── JWT Secret handling ───────────────────────────────────────────────────────
if ($JwtSecret -eq "") {
    Write-Warn "No -JwtSecret provided — generating a random one."
    $JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    Write-Warn "Generated JWT_SECRET (save this!): $JwtSecret"
}

Write-Step "Deploying backend to Cloud Run..."
gcloud run deploy smartvenue-backend `
    --image=$backendImg `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --min-instances=1 `
    --max-instances=5 `
    --memory=512Mi `
    --cpu=1 `
    --timeout=300 `
    --set-env-vars="NODE_ENV=production,JWT_SECRET=$JwtSecret,JWT_EXPIRY=7d" `
    --project=$ProjectId

# Get backend URL
$backendUrl = gcloud run services describe smartvenue-backend `
    --region=$Region `
    --format="value(status.url)" `
    --project=$ProjectId

Write-Ok "Backend deployed: $backendUrl"

# ════════════════════════════════════════════════════════════════════════════════
#  FRONTEND
# ════════════════════════════════════════════════════════════════════════════════

Write-Step "Building frontend Docker image (baking in backend URL: $backendUrl)..."
if (-not $SkipBuild) {
    docker build `
        --build-arg NEXT_PUBLIC_API_URL=$backendUrl `
        -t $frontendImg `
        -t "gcr.io/$ProjectId/smartvenue-frontend:latest" `
        ./frontend
    Write-Ok "Frontend image built: $frontendImg"
} else {
    Write-Warn "Skipping build (--SkipBuild flag set)"
}

Write-Step "Pushing frontend image to GCR..."
docker push $frontendImg
docker push "gcr.io/$ProjectId/smartvenue-frontend:latest"
Write-Ok "Frontend image pushed"

Write-Step "Deploying frontend to Cloud Run..."
gcloud run deploy smartvenue-frontend `
    --image=$frontendImg `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --min-instances=1 `
    --max-instances=5 `
    --memory=512Mi `
    --cpu=1 `
    --timeout=300 `
    --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=$backendUrl" `
    --project=$ProjectId

# Get frontend URL
$frontendUrl = gcloud run services describe smartvenue-frontend `
    --region=$Region `
    --format="value(status.url)" `
    --project=$ProjectId

# ── Update backend CORS with frontend URL ─────────────────────────────────────
Write-Step "Updating backend CORS with frontend URL..."
gcloud run services update smartvenue-backend `
    --region=$Region `
    --update-env-vars="FRONTEND_URL=$frontendUrl" `
    --project=$ProjectId

Write-Ok "Backend CORS updated"

# ════════════════════════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════════════════════════
Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║                   🚀 Deployment Complete!                        ║
╠══════════════════════════════════════════════════════════════════╣
║  Frontend  →  $($frontendUrl.PadRight(50)) ║
║  Backend   →  $($backendUrl.PadRight(50)) ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green
