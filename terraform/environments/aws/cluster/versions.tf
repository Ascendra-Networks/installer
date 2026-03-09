# Provider requirements for this module (no backend; parent defines backend).

terraform {
  required_providers {
    aws = {
      source  = "registry.terraform.io/hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "registry.terraform.io/hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "registry.terraform.io/hashicorp/local"
      version = "~> 2.0"
    }
    null = {
      source  = "registry.terraform.io/hashicorp/null"
      version = "~> 3.0"
    }
  }
}
