# AWS K8s Cluster Module
# Reconstructed from terraform state

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
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Default Ubuntu AMI (x86_64)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-*-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# Get existing VPC if ID is provided
data "aws_vpc" "existing" {
  count = var.vpc_id != "" ? 1 : 0
  id    = var.vpc_id
}

# Get existing subnet if ID is provided
data "aws_subnet" "existing" {
  count = var.subnet_id != "" ? 1 : 0
  id    = var.subnet_id
}

# Locals to determine which VPC/subnet to use and apply defaults
locals {
  create_vpc    = var.vpc_id == ""
  create_subnet = var.subnet_id == ""
  
  # For existing VPCs, always create IGW to ensure connectivity
  # This is safe because if IGW already exists, AWS will return an error and we can handle it
  # For new VPCs, we always create IGW
  create_igw = true
  
  # Use provided CIDR or fall back to defaults from cluster-defaults.json
  vpc_cidr_block    = var.vpc_cidr != "" ? var.vpc_cidr : local.vpc_default_cidr
  subnet_cidr_block = var.subnet_cidr != "" ? var.subnet_cidr : local.subnet_default_cidr
  
  vpc_id    = local.create_vpc ? aws_vpc.k8s_vpc[0].id : var.vpc_id
  subnet_id = local.create_subnet ? aws_subnet.k8s_subnet[0].id : var.subnet_id
}

# VPC (only created if vpc_id is empty)
resource "aws_vpc" "k8s_vpc" {
  count                = local.create_vpc ? 1 : 0
  cidr_block           = local.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.cluster_name}${local.vpc_name_suffix}"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# Internet Gateway
# Always created to ensure internet connectivity
# Uses lifecycle ignore to prevent recreation if already exists
resource "aws_internet_gateway" "k8s_igw" {
  vpc_id = local.vpc_id

  tags = {
    Name        = "${var.cluster_name}-igw"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
  
  lifecycle {
    # Ignore changes to prevent conflicts if VPC already has an IGW
    ignore_changes = [tags]
  }
}

# Subnet (only created if subnet_id is empty)
resource "aws_subnet" "k8s_subnet" {
  count                   = local.create_subnet ? 1 : 0
  vpc_id                  = local.vpc_id
  cidr_block              = local.subnet_cidr_block
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.cluster_name}${local.subnet_name_suffix}"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# Get main route table for the VPC
data "aws_route_table" "main" {
  vpc_id = local.vpc_id
  
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

# Route Table (only created if we're creating a new VPC)
resource "aws_route_table" "k8s_rt" {
  count  = local.create_vpc ? 1 : 0
  vpc_id = local.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.k8s_igw.id
  }

  tags = {
    Name        = "${var.cluster_name}-rt"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# Route Table Association (only if we created both route table and subnet)
resource "aws_route_table_association" "k8s_rta" {
  count          = local.create_vpc && local.create_subnet ? 1 : 0
  subnet_id      = aws_subnet.k8s_subnet[0].id
  route_table_id = aws_route_table.k8s_rt[0].id
}

# Add or update default route in main route table (for both new and existing VPCs)
resource "aws_route" "default_route" {
  route_table_id         = data.aws_route_table.main.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.k8s_igw.id
  
  lifecycle {
    # Create if not exists, but don't fail if route already exists
    create_before_destroy = true
  }
  
  # Only create if using existing VPC (new VPCs have route table with route already)
  count = local.create_vpc ? 0 : 1
}

# Security Group
resource "aws_security_group" "k8s_sg" {
  name        = "${var.cluster_name}-sg"
  description = "Security group for Kubernetes cluster"
  vpc_id      = local.vpc_id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all internal traffic
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-sg"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# SSH Key Pair
resource "tls_private_key" "ssh" {
  count     = 1
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "k8s_key" {
  key_name   = "${var.cluster_name}-key"
  public_key = tls_private_key.ssh[0].public_key_openssh
}

# Create .ssh directory if it doesn't exist
resource "null_resource" "create_ssh_dir" {
  provisioner "local-exec" {
    command = "mkdir -p ${abspath(path.module)}/../../.ssh"
  }
}

resource "local_file" "private_key" {
  count           = 1
  content         = tls_private_key.ssh[0].private_key_pem
  filename        = "${abspath(path.module)}/../../.ssh/${var.cluster_name}-key.pem"
  file_permission = "0600"
  
  depends_on = [null_resource.create_ssh_dir]
}

# Master Instances
resource "aws_instance" "k8s_master" {
  count         = 1
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.master_instance_type
  key_name      = aws_key_pair.k8s_key.key_name
  subnet_id     = local.subnet_id

  # Always assign public IP (required for external SSH access and Ansible)
  associate_public_ip_address = true

  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = local.master_disk_size
    volume_type = local.master_disk_type
  }

  user_data = <<-EOF
              #!/bin/bash
              echo "Master node ${count.index + 1}"
              EOF

  tags = {
    Name        = "${var.cluster_name}-master-${count.index + 1}"
    Role        = "master"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# Placement Group for worker nodes (only created if strategy is specified)
resource "aws_placement_group" "workers" {
  count    = var.placement_group_strategy != "" ? 1 : 0
  name     = "${var.cluster_name}-workers-pg"
  strategy = var.placement_group_strategy

  tags = {
    Name        = "${var.cluster_name}-workers-pg"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

# Local variables to handle both old and new worker configuration
locals {
  # Support multiple configuration methods for backward compatibility
  # Priority: worker_instances > worker_instances_type > old method (worker_instance_type + worker_count)
  
  worker_configs = length(var.worker_instances) > 0 ? var.worker_instances : (
    length(var.worker_instances_type) > 0 ? {
      for instance_type, count in var.worker_instances_type : instance_type => {
        type  = instance_type
        count = count
        ami   = lookup(var.worker_instance_amis, instance_type, null)
      }
    } : (
      var.worker_count > 0 ? {
        "default" = {
          type  = var.worker_instance_type
          count = var.worker_count
          ami   = null
        }
      } : {}
    )
  )
  
  # Flatten the map into a list for for_each
  worker_list = flatten([
    for group_name, config in local.worker_configs : [
      for i in range(config.count) : {
        key           = "${config.type}-${i}"
        instance_type = config.type
        custom_ami    = config.ami
        index         = i
      }
    ]
  ])
  
  worker_map = {
    for worker in local.worker_list : worker.key => worker
  }
}

# Worker Instances (using for_each for flexibility)
resource "aws_instance" "k8s_worker" {
  for_each = local.worker_map

  # AMI selection: Use custom AMI if specified, otherwise use default Ubuntu x86_64
  ami = each.value.custom_ami != null ? each.value.custom_ami : data.aws_ami.ubuntu.id
  
  instance_type = each.value.instance_type
  key_name      = aws_key_pair.k8s_key.key_name
  subnet_id     = local.subnet_id

  placement_group = var.placement_group_strategy != "" ? aws_placement_group.workers[0].id : null

  # Always assign public IP (required for external SSH access and Ansible)
  associate_public_ip_address = true

  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = local.worker_disk_size
    volume_type = local.worker_disk_type
  }

  user_data = <<-EOF
              #!/bin/bash
              echo "Worker node ${each.key}"
              EOF

  tags = {
    Name         = "${var.cluster_name}-worker-${each.key}"
    Role         = "worker"
    InstanceType = each.value.instance_type
    ManagedBy    = local.managed_by_tag
    ClusterName  = var.cluster_name
  }
}

