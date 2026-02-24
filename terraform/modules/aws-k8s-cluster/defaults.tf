# Load shared cluster defaults from centralized config file
# This ensures Terraform and UI use the same defaults
locals {
  # Read cluster defaults from shared JSON config
  cluster_defaults = jsondecode(file("${path.module}/../../../config/cluster-defaults.json"))
  
  # Extract network defaults
  vpc_default_cidr    = local.cluster_defaults.network.vpc.cidr
  subnet_default_cidr = local.cluster_defaults.network.subnet.cidr
  vpc_name_suffix     = local.cluster_defaults.network.vpc.nameSuffix
  subnet_name_suffix  = local.cluster_defaults.network.subnet.nameSuffix
  
  # Extract compute defaults
  master_default_instance_type = local.cluster_defaults.compute.master.instanceType
  master_disk_size            = local.cluster_defaults.compute.master.diskSize
  master_disk_type            = local.cluster_defaults.compute.master.diskType
  worker_disk_size            = local.cluster_defaults.compute.worker.diskSize
  worker_disk_type            = local.cluster_defaults.compute.worker.diskType
  
  # Extract tags
  managed_by_tag = local.cluster_defaults.tags.managedBy
}


