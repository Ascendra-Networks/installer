# Compute: master node(s), optional placement group, worker nodes.

resource "aws_instance" "k8s_master" {
  count         = 1
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.master_instance_type
  key_name      = aws_key_pair.k8s_key.key_name
  subnet_id     = local.subnet_id

  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.k8s_sg.id]

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

resource "aws_instance" "k8s_worker" {
  for_each = local.worker_map

  ami           = each.value.custom_ami != null ? each.value.custom_ami : data.aws_ami.ubuntu.id
  instance_type = each.value.instance_type
  key_name      = aws_key_pair.k8s_key.key_name
  subnet_id     = local.subnet_id

  placement_group = var.placement_group_strategy != "" ? aws_placement_group.workers[0].id : null
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.k8s_sg.id]

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
