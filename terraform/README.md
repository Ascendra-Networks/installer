# Terraform — System Provisioner

This directory is the **provisioner** for the system: it creates and manages the cloud infrastructure (networking, compute, SSH keys) that the rest of the stack (Ansible, Kubernetes, apps) runs on.

## Layout

```
terraform/
├── README.md                 # This file
├── .gitignore
└── environments/             # One directory per cloud / environment
    └── aws/                  # AWS: run Terraform from here
        ├── versions.tf       # Terraform & provider versions, backend
        ├── provider.tf       # AWS provider config
        ├── variables.tf
        ├── main.tf           # Calls cluster module + Ansible inventory
        ├── outputs.tf
        ├── ansible_inventory.tpl
        ├── terraform.tfvars.example
        ├── .ssh/             # Generated keys (created by cluster module)
        ├── terraform.tfstate.d/  # Per-workspace state (e.g. dev, prod)
        └── cluster/          # K8s cluster (VPC, instances, keys)
            ├── main.tf
            ├── data.tf, defaults.tf, locals.tf
            ├── network.tf, security.tf, keys.tf, instances.tf
            ├── variables.tf, outputs.tf, versions.tf
```

All environment-specific code lives under **environments/** (e.g. **environments/aws/**). Use **workspaces** (dev, prod) to separate state per environment.

## Workspaces (dev, prod)

Run all Terraform commands from `terraform/environments/aws/`:

```bash
cd terraform/environments/aws

# Create and use workspaces
terraform workspace new dev    # first time only
terraform workspace new prod   # first time only

# Work in dev
terraform workspace select dev
terraform init
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars

# Switch to prod
terraform workspace select prod
terraform apply -var-file=prod.tfvars
```

State is stored under `terraform/environments/aws/terraform.tfstate.d/<workspace>/terraform.tfstate`.

## Quick start (CLI)

From the repo root:

```bash
cd terraform/environments/aws
terraform init
terraform workspace select dev   # or: terraform workspace new dev
terraform plan -var-file=mycluster.tfvars
terraform apply -var-file=mycluster.tfvars
```

Outputs include master/worker IPs, SSH key path, and the generated Ansible inventory path.

## Integration

- **Installer (UI)** runs Terraform from `terraform/environments/aws/` and can use a workspace (e.g. dev/prod) and a tfvars file per cluster.
- **Shared defaults** (e.g. VPC CIDR, instance types) come from `config/cluster-defaults.json`; the cluster module reads them via `cluster/defaults.tf`.

## State

- Backend is **local** with `path = "terraform.tfstate"`.
- With workspaces, state lives in `terraform/environments/aws/terraform.tfstate.d/<workspace>/terraform.tfstate`.
