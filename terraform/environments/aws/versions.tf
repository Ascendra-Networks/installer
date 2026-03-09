# Terraform and provider requirements; state backend.
# Run all Terraform commands from this directory (terraform/environments/aws/).
# Backend path cannot use variables; to get state under ../../state/<workspace>/state.tfstate
# run: terraform init -reconfigure -backend-config=backend-config/<workspace>.tfbackend
# Default below = dev (repo root state/dev/state.tfstate).

terraform {
  required_version = ">= 1.0"

  backend "local" {
    path = "../../../state/dev/state.tfstate"
  }

  required_providers {
    aws = {
      source  = "registry.terraform.io/hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "registry.terraform.io/hashicorp/local"
      version = "~> 2.0"
    }
    tls = {
      source  = "registry.terraform.io/hashicorp/tls"
      version = "~> 4.0"
    }
    null = {
      source  = "registry.terraform.io/hashicorp/null"
      version = "~> 3.0"
    }
  }
}
