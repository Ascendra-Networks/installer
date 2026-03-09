# Outputs consumed by the installer and for manual next steps.

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
