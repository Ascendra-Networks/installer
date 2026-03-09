# SSH key pair: generated key, AWS key pair, and private key file on disk.
# Keys are stored under environments/aws/.ssh/ (one level up from this module).

resource "tls_private_key" "ssh" {
  count     = 1
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "k8s_key" {
  key_name   = "${var.cluster_name}-key"
  public_key = tls_private_key.ssh[0].public_key_openssh
}

resource "null_resource" "create_ssh_dir" {
  provisioner "local-exec" {
    command = "mkdir -p ${abspath(path.module)}/../.ssh"
  }
}

resource "local_file" "private_key" {
  count           = 1
  content         = tls_private_key.ssh[0].private_key_pem
  filename        = "${abspath(path.module)}/../.ssh/${var.cluster_name}-key.pem"
  file_permission = "0600"

  depends_on = [null_resource.create_ssh_dir]
}
