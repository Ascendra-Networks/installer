# AWS provider configuration.
# Credentials (choose one):
#   - Env vars: export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
#   - Profile:  aws_profile in tfvars, or profile in ~/.aws/credentials (run: aws configure)
#   - File:     AWS_SHARED_CREDENTIALS_FILE + AWS_PROFILE

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile != "" ? var.aws_profile : null
}
