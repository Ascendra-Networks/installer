# Environments

One directory per **cloud / environment**. Run Terraform from the chosen environment (e.g. **aws/**).

- **aws/** — AWS: K8s cluster (VPC, instances, SSH keys). Use workspaces (dev, prod) for state separation.

To add another cloud (e.g. Azure), create `terraform/environments/azure/` with its own backend, provider, and cluster (or equivalent) code.
