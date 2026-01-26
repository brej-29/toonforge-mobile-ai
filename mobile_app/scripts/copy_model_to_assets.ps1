Param(
    [Parameter(Mandatory = $true)]
    [string]$ModelFile
)

# Copy a TFLite model from models/artifacts/downloaded/ into the Flutter
# app assets directory (mobile_app/toonforge_app/assets/models/).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File mobile_app/scripts/copy_model_to_assets.ps1 -ModelFile cartoongan-fp16.tflite

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$srcDir = Join-Path $repoRoot "models\artifacts\downloaded"
$destDir = Join-Path $repoRoot "mobile_app\toonforge_app\assets\models"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$srcPath = Join-Path $srcDir $ModelFile
if (-not (Test-Path $srcPath)) {
    Write-Error "Model file not found: $srcPath. Download it using the cartoonizer CLI first."
    exit 1
}

Copy-Item $srcPath $destDir -Force
Write-Output "Copied $ModelFile to $destDir"