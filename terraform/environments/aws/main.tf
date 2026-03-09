# AWS environment: one K8s cluster module + Ansible inventory.
# Use workspaces (dev, prod) to separate state. Variables in variables.tf; outputs in outputs.tf.

module "k8s_cluster" {
  source = "./cluster"

  cluster_name             = var.cluster_name
  aws_region               = var.aws_region
  availability_zone        = var.availability_zone
  master_instance_type     = var.master_instance_type
  worker_instance_type     = var.worker_instance_type
  worker_count             = var.worker_count
  worker_instances_type    = var.worker_instances_type
  worker_instance_amis     = var.worker_instance_amis
  worker_instances         = var.worker_instances
  placement_group_strategy = var.placement_group_strategy
  vpc_id                   = var.vpc_id
  subnet_id                = var.subnet_id
  vpc_cidr                 = var.vpc_cidr
  subnet_cidr              = var.subnet_cidr
  ssh_public_key           = var.ssh_public_key
}

# Generate Ansible inventory from cluster outputs (repo root: ../../../ansible).
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/ansible_inventory.tpl", {
    master_ips   = module.k8s_cluster.master_public_ips
    worker_ips   = module.k8s_cluster.worker_public_ips
    ssh_key_path = module.k8s_cluster.ssh_private_key_path
  })
  filename = "${abspath(path.module)}/../../../ansible/inventory/${var.cluster_name}.ini"
}
