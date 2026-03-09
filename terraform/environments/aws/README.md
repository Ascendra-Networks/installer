# AWS environment

This directory provisions a **single Kubernetes cluster** on AWS. Use Terraform **workspaces** (e.g. `dev`, `prod`) to manage multiple clusters.

---

## Resource scope: singular vs multiple

| Resource / setting | Singular or multiple | Variable(s) | Notes |
|--------------------|------------------------|-------------|--------|
| **Region** | Singular | `aws_region` | One region per cluster (e.g. `us-east-1`). |
| **Availability zone** | Singular | `availability_zone` | One AZ; all nodes (master + workers) in that AZ. |
| **VPC** | Singular | `vpc_id` | One VPC: create new (empty) or use existing by ID. |
| **Subnet** | Singular | `subnet_id` | One subnet: create new (empty) or use existing by ID. |
| **Internet gateway** | Singular | — | One IGW per VPC (created or uses main route table). |
| **Security group** | Singular | — | One SG for the cluster (SSH, K8s API, internal). |
| **Master node (EC2)** | Singular | `master_instance_type` | One master; one instance type. |
| **Worker nodes (EC2)** | Multiple | `worker_instances` or `worker_instance_type` + `worker_count` | Many workers; can have multiple **groups** with different instance types and counts (and optional AMI per group). |
| **Instance types** | Multiple (workers only) | `worker_instances` | Each group: `type`, `count`, optional `ami`. |
| **Placement group** | Singular | `placement_group_strategy` | One strategy for all workers: `""`, `cluster`, `spread`, or `partition`. |
| **SSH key pair** | Singular | `ssh_public_key` | One key: generated (empty) or supply your public key. |

---

## Creation flow (order of creation)

On `terraform apply`, Terraform resolves dependencies and creates resources in this logical order. Later steps depend on earlier ones.

| Phase | What is created | Why this order |
|-------|------------------|----------------|
| **1. Data & locals** | Data sources (AMI, AZs, optional existing VPC/subnet, route table). Locals and defaults (from `config/cluster-defaults.json`). | No resources created; values are read so later resources can reference them. |
| **2. Network – VPC** | VPC (if `vpc_id` is empty). | Foundation; subnet and IGW need a VPC. |
| **3. Network – IGW** | Internet gateway attached to the VPC (or existing VPC). | Required for public connectivity; route table needs the IGW. |
| **4. Network – subnet** | Subnet (if `subnet_id` is empty) in the chosen AZ. | Instances will be launched in this subnet. |
| **5. Network – routing** | Route table (new VPC only), route table ↔ subnet association, or default route (existing VPC only). | Ensures traffic to the internet goes via the IGW. |
| **6. Security group** | One security group (SSH 22, K8s API 6443, internal, egress). | Must exist before instances; instances reference this SG. |
| **7. SSH keys** | TLS private key → AWS key pair; local `.ssh` dir; private key file on disk. | EC2 instances need the key pair for SSH; keys are independent of network. |
| **8. Placement group** | Placement group for workers (only if `placement_group_strategy` is set). | Workers optionally depend on it; no dependency on instances. |
| **9. Instances** | Master EC2 (1); worker EC2 (per `worker_instances` or `worker_count`). | Need: subnet, security group, key pair, AMI; workers can use placement group. |
| **10. Ansible inventory** | File `ansible/inventory/<cluster_name>.ini` (at repo root). | Written after the cluster module; uses master/worker IPs and SSH key path from outputs. |

**In short:** data/local values → VPC → IGW → subnet → routing → security group → SSH keys → (placement group) → instances → Ansible inventory.

---

## How to configure

### Region and AZ (singular)

```hcl
aws_region        = "us-east-1"
availability_zone = "us-east-1a"
```

### VPC and subnet (singular each)

**New VPC and subnet:** leave IDs empty; optional CIDRs (otherwise from `config/cluster-defaults.json`):

```hcl
vpc_id     = ""
subnet_id  = ""
vpc_cidr   = "10.0.0.0/16"   # optional
subnet_cidr = "10.0.1.0/24"  # optional
```

**Existing VPC and subnet:**

```hcl
vpc_id    = "vpc-0123456789abcdef0"
subnet_id = "subnet-0123456789abcdef0"
```

### Master (singular) and workers (multiple)

**One worker type:**

```hcl
master_instance_type = "t3.large"
worker_instance_type = "t3.large"
worker_count         = 2
```

**Multiple worker groups (types/counts/AMIs):**

```hcl
master_instance_type = "t3.large"

worker_instances = {
  "general" = { type = "t3.large", count = 2 }
  "gpu"     = { type = "g4dn.xlarge", count = 1, ami = "ami-xxxx" }
}
```

Worker disk size/type come from `config/cluster-defaults.json`, not tfvars.

### Placement group (singular, workers only)

```hcl
placement_group_strategy = ""        # none (default)
# placement_group_strategy = "cluster"
# placement_group_strategy = "spread"
# placement_group_strategy = "partition"
```

### SSH (singular)

```hcl
ssh_public_key = ""   # generate key; private key saved to .ssh/<cluster_name>-key.pem
# ssh_public_key = "ssh-rsa AAAA..."
```

---

## Variables quick reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `cluster_name` | Yes | — | Cluster name (resource names, Ansible inventory). |
| `aws_region` | Yes | — | AWS region. |
| `availability_zone` | Yes | — | Single AZ for all nodes. |
| `master_instance_type` | Yes | — | EC2 type for master. |
| `worker_instance_type` | No | `""` | EC2 type for workers when `worker_instances` is empty. |
| `worker_count` | No | `0` | Worker count when `worker_instances` is empty. |
| `worker_instances` | No | `{}` | Map of groups: `{ "name" = { type, count, ami? } }`. |
| `vpc_id` | No | `""` | Existing VPC ID or empty to create. |
| `subnet_id` | No | `""` | Existing subnet ID or empty to create. |
| `vpc_cidr` | No | from config | CIDR for new VPC. |
| `subnet_cidr` | No | from config | CIDR for new subnet. |
| `placement_group_strategy` | No | `""` | `""`, `cluster`, `spread`, `partition`. |
| `ssh_public_key` | No | `""` | Your public key or empty to generate. |

---

## Run

From this directory (`terraform/environments/aws/`):

```bash
terraform init
terraform workspace select dev   # or: terraform workspace new dev
terraform plan -var-file=mycluster.tfvars
terraform apply -var-file=mycluster.tfvars
```

Outputs: master/worker IPs, SSH key path, Ansible inventory path.
