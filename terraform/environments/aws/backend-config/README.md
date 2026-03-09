# Backend config: state per workspace

State is stored as **`state/<workspace>/state.tfstate`** at repo root (e.g. `state/dev/state.tfstate`, `state/prod/state.tfstate`). The backend block cannot use variables or `terraform.workspace`, so you choose the path at **init** time by passing the right backend config.

## Use workspace-based state

**Dev** (state in repo root `state/dev/state.tfstate`):

```bash
terraform workspace select dev
terraform init -reconfigure -backend-config=backend-config/dev.tfbackend
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

**Prod** (state in repo root `state/prod/state.tfstate`):

```bash
terraform workspace select prod
terraform init -reconfigure -backend-config=backend-config/prod.tfbackend
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Add another workspace

Create `backend-config/<name>.tfbackend` with:

```hcl
path = "../../../state/<name>/state.tfstate"
```

Then run init with `-backend-config=backend-config/<name>.tfbackend` when using that workspace.

## Default

If you run `terraform init` with no `-backend-config`, the path from `versions.tf` is used (default: `state/dev/state.tfstate`).
