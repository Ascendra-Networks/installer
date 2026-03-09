# Locals: network selection (create vs existing VPC/subnet) and worker instance mapping.

locals {
  create_vpc    = var.vpc_id == ""
  create_subnet = var.subnet_id == ""
  create_igw    = local.create_vpc

  vpc_cidr_block    = var.vpc_cidr != "" ? var.vpc_cidr : local.vpc_default_cidr
  subnet_cidr_block = var.subnet_cidr != "" ? var.subnet_cidr : local.subnet_default_cidr

  vpc_id    = local.create_vpc ? aws_vpc.k8s_vpc[0].id : var.vpc_id
  subnet_id = local.create_subnet ? aws_subnet.k8s_subnet[0].id : var.subnet_id
  igw_id    = local.create_igw ? aws_internet_gateway.k8s_igw[0].id : data.aws_internet_gateway.existing[0].id
}

locals {
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
