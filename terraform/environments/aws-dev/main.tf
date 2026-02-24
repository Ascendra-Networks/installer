terraform {
  required_version = ">= 1.0"
  
  backend "local" {
    path = "terraform.tfstate"
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
  }
}

provider "aws" {
  region = var.aws_region
}

module "k8s_cluster" {
  source = "../../modules/aws-k8s-cluster"
  
  cluster_name          = var.cluster_name
  aws_region            = var.aws_region
  availability_zone     = var.availability_zone
  master_instance_type  = var.master_instance_type
  worker_instance_type  = var.worker_instance_type
  worker_count          = var.worker_count
  worker_instances_type = var.worker_instances_type
  worker_instance_amis  = var.worker_instance_amis
  worker_instances      = var.worker_instances
  placement_group_strategy = var.placement_group_strategy
  vpc_id                   = var.vpc_id
  subnet_id                = var.subnet_id
  vpc_cidr                 = var.vpc_cidr
  subnet_cidr              = var.subnet_cidr
  ssh_public_key           = var.ssh_public_key
}

# Generate Ansible inventory file
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/ansible_inventory.tpl", {
    master_ips      = module.k8s_cluster.master_public_ips
    worker_ips      = module.k8s_cluster.worker_public_ips
    ssh_key_path    = module.k8s_cluster.ssh_private_key_path  # Already absolute
  })
  filename = "${abspath(path.module)}/../../../ansible/inventory/${var.cluster_name}.ini"
}

output "master_ips" {
  value = module.k8s_cluster.master_public_ips
}

output "worker_ips" {
  value = module.k8s_cluster.worker_public_ips
}

output "worker_details" {
  value = module.k8s_cluster.worker_details
}

output "ssh_private_key_path" {
  value     = module.k8s_cluster.ssh_private_key_path
  sensitive = true
}

output "ansible_inventory" {
  value     = local_file.ansible_inventory.content
  sensitive = true
}

output "ssh_command_master" {
  value = "ssh -i <key-path> ubuntu@${module.k8s_cluster.master_public_ips[0]}"
}

output "next_steps" {
  value = module.k8s_cluster.next_steps
}

