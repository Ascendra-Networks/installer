# Ansible

This directory is the Ansible project root. Run playbooks from here (`ansible/`).

---

## Ascendra environment (K8s, Tyr, Dashboard)

To deploy a Kubernetes cluster, Tyr, and the management dashboard:

**See [playbooks/ascendra-environment/README.md](playbooks/ascendra-environment/README.md)** for:

- Prerequisites (inventory, group_vars, SSH)
- First-time setup (copy `hosts.example` → `hosts`, `all.yml.example` → `all.yml`, set `ghcr_username` / `ghcr_password`)
- Run order and commands
- Optional (limit, tags, extra vars)

The default inventory in `ansible.cfg` is **`inventory`** (i.e. `ansible/inventory`). Edit `inventory/hosts` and `inventory/group_vars/` for your hosts and variables. Use **`-i path/to/inventory`** to override.
