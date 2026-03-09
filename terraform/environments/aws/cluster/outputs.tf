output "master_public_ips" {
  description = "Public IP addresses of master nodes"
  value       = aws_instance.k8s_master[*].public_ip
}

output "worker_public_ips" {
  description = "Public IP addresses of worker nodes"
  value       = [for instance in aws_instance.k8s_worker : instance.public_ip]
}

output "worker_details" {
  description = "Detailed information about worker nodes"
  value = {
    for key, instance in aws_instance.k8s_worker : key => {
      public_ip     = instance.public_ip
      private_ip    = instance.private_ip
      instance_type = instance.instance_type
      instance_id   = instance.id
    }
  }
}

output "ssh_private_key_path" {
  description = "Path to SSH private key (absolute path)"
  value       = abspath(local_file.private_key[0].filename)
}

output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

output "subnet_id" {
  description = "Subnet ID"
  value       = local.subnet_id
}

output "next_steps" {
  value = <<-EOF

=== Infrastructure Provisioned Successfully! ===

Next Steps:

1. Wait for instances to be ready (60 seconds):
   sleep 60

2. Deploy Kubernetes using Ansible (from repo root):
   cd ../../../ansible
   ./run.sh inventory/${var.cluster_name}.ini

3. SSH to master node:
   ssh ubuntu@${aws_instance.k8s_master[0].public_ip}

4. Deploy Tyr and KubeVirt (on master node):
   Follow instructions in scripts/on_prem_setup.md

5. Deploy VMs using Helm:
   helm install my-vms ../helm/kubevirt-vms --set vmCount=4

Master IPs: ${join(", ", aws_instance.k8s_master[*].public_ip)}
Worker IPs: ${join(", ", [for instance in aws_instance.k8s_worker : instance.public_ip])}
EOF
}
