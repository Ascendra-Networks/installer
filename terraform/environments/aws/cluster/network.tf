# Network: VPC, subnet, internet gateway, route table and default route.

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

resource "aws_internet_gateway" "k8s_igw" {
  count  = local.create_igw ? 1 : 0
  vpc_id = local.vpc_id

  tags = {
    Name        = "${var.cluster_name}-igw"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }

  lifecycle {
    ignore_changes = [tags]
  }
}

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

resource "aws_route_table" "k8s_rt" {
  count  = local.create_vpc ? 1 : 0
  vpc_id = local.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = local.igw_id
  }

  tags = {
    Name        = "${var.cluster_name}-rt"
    ManagedBy   = local.managed_by_tag
    ClusterName = var.cluster_name
  }
}

resource "aws_route_table_association" "k8s_rta" {
  count          = local.create_vpc && local.create_subnet ? 1 : 0
  subnet_id      = aws_subnet.k8s_subnet[0].id
  route_table_id = aws_route_table.k8s_rt[0].id
}
