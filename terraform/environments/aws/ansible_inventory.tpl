[all:vars]
ansible_connection=ssh
ansible_user=ubuntu
ansible_ssh_private_key_file=${ssh_key_path}
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
master_public_ip=${master_ips[0]}

[masters]
%{ for ip in master_ips ~}
${ip}
%{ endfor ~}

[workers]
%{ for ip in worker_ips ~}
${ip}
%{ endfor ~}
