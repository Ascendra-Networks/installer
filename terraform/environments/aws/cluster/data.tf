# Data sources: AMI, availability zones, optional existing VPC/subnet/IGW.

data "aws_availability_zones" "available" {
  state = "available"
}

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

data "aws_vpc" "existing" {
  count = var.vpc_id != "" ? 1 : 0
  id    = var.vpc_id
}

data "aws_subnet" "existing" {
  count = var.subnet_id != "" ? 1 : 0
  id    = var.subnet_id
}

data "aws_internet_gateway" "existing" {
  count = local.create_igw ? 0 : 1

  filter {
    name   = "attachment.vpc-id"
    values = [local.vpc_id]
  }
}
