# Ascendra environment playbooks

This directory contains the playbooks and **inventory** (hosts + group_vars) for the Ascendra environment: Kubernetes cluster, Tyr, and the management dashboard. Other playbooks in this repo can use different inventory and variable conventions.

**Run from the `ansible/` directory**, not from this folder. The default inventory in `ansible.cfg` is **`ansible/inventory`** (the inventory directory at the repo root).

---

## 1. Prerequisites (required before any playbook runs)

You must have the following in place or the playbooks will not run.

### Inventory (hosts)

Inventory lives in **`ansible/inventory/`**. Edit `ansible/inventory/hosts` and add your nodes (or copy from `hosts.example`):

```bash
cd ansible
# Edit inventory/hosts: add your hostnames or IPs under [masters], [workers].
```

**Example `inventory/hosts`** — Define hosts only under `[masters]` and/or `[workers]`; `[all]` is the union:

```ini
[all:children]
masters
workers

[masters]
master1 ansible_host=192.168.1.10

[workers]
worker1 ansible_host=192.168.1.20
worker2 ansible_host=192.168.1.21
```

(Single-node: put the same host in both `[masters]` and `[workers]`.)

### Variables (group_vars)

Group variables live under **`ansible/inventory/group_vars/`**. The inventory defines *which* hosts; `group_vars/` defines *what* to deploy (versions, credentials, CIDRs, etc.).

| File          | Purpose                                |
|---------------|----------------------------------------|
| `all.yml`     | Shared vars for all Ascendra playbooks |
| `masters.yml` | Master-only (e.g. kubeconfig paths)    |
| `workers.yml` | Worker-only                            |

### SSH

Access to hosts with passwordless sudo or root.

### First-time setup (inventory + variables)

```bash
cd ansible
cp inventory/hosts.example inventory/hosts
cp inventory/group_vars/all.yml.example inventory/group_vars/all.yml
# Edit inventory/hosts: add your hostnames/IPs under [masters], [workers].
# Edit inventory/group_vars/all.yml: set ghcr_username, ghcr_password (versions have defaults).
```

**Required in `inventory/group_vars/all.yml`** (for tyr-deploy and dashboard-deploy):

| Variable        | Meaning                   |
|-----------------|---------------------------|
| `ghcr_username` | GHCR registry username    |
| `ghcr_password` | GHCR token (read:packages)|

**Optional** (defaults in playbooks): `tyr_version` (default 1.0.4), `dashboard_version` (default 1.0.26).

Everything else has defaults; see **`ansible/inventory/group_vars/all.yml.example`** for the full list and comments.

---

## 2. Run order

**Always pass the inventory file** so it works even when `ansible.cfg` is ignored (e.g. world-writable directory under WSL). Use the path to the **hosts file**, not the directory:

```bash
cd ansible   # ansible repo root

ansible-playbook -i inventory/hosts playbooks/ascendra-environment/k8s-cluster-deploy.yml
ansible-playbook -i inventory/hosts playbooks/ascendra-environment/tyr-deploy.yml
ansible-playbook -i inventory/hosts playbooks/ascendra-environment/dashboard-deploy.yml
```

Ansible will still load `inventory/group_vars/` because it sits next to the inventory file.

| Playbook | Purpose |
|----------|---------|
| **k8s-cluster-deploy.yml** | Prereqs on all nodes, init master, join workers, cluster status. |
| **tyr-deploy.yml** | Helm, GHCR login, GHCR secret in namespaces, Tyr + InfraManager, wait for Tyr/KubeVirt/Kube-OVN. |
| **dashboard-deploy.yml** | Monitoring namespace, storage, InfluxDB secret, management-dashboard Helm. |

- Run **tyr-deploy** before **dashboard-deploy** so the GHCR pull secret exists in the `monitoring` namespace.
- After **k8s-cluster-deploy**, install a CNI (e.g. Calico/Flannel) so nodes become Ready; see playbook output for the command.
- **Upgrading Kubernetes:** Set `kubernetes_version` in `inventory/group_vars/all.yml` to the desired version (e.g. `1.35.1`) and re-run **k8s-cluster-deploy.yml**. The playbook will upgrade packages on all nodes and run `kubeadm upgrade apply` on the control-plane and `kubeadm upgrade node` on workers. Upgrade one minor version at a time (e.g. 1.31 → 1.32 → 1.33) if your current version is far behind.
- **Reset and reinstall (fresh cluster):** To avoid multi-step upgrades, you can tear down the existing cluster and install fresh at the target version. Set `k8s_reset_cluster: true` (and the desired `kubernetes_version`, e.g. `1.35.1`) in `inventory/group_vars/all.yml`, then run **k8s-cluster-deploy.yml**. Phase 1.5 will run `kubeadm reset` and remove cluster data on all nodes, then the playbook will do a fresh init and join. **Warning:** all cluster state (workloads, data) is lost.

---

## 3. Troubleshooting

- **"No inventory was parsed" / "provided hosts list is empty"** — (1) Ansible ignores `ansible.cfg` from a world-writable directory; (2) use the inventory **file** not the directory: `-i inventory/hosts` (not `-i inventory/`).
  ```bash
  ansible-playbook -i inventory/hosts playbooks/ascendra-environment/k8s-cluster-deploy.yml
  ```

- **InfraManager: "Release name is invalid: ""** — The Tyr InfraManager controller uses an empty Helm release name when deploying KubeOvn. This is a bug in the Tyr controller (Ascendra-Networks/tyr); the InfraManager CRD does not expose a field to set the release name. **Workarounds:** (1) Upgrade Tyr to a newer chart version (`tyr_version` in `group_vars/all.yml`) if a fix was released; (2) Report the issue to Ascendra / Tyr maintainers so the controller defaults the KubeOvn Helm release name (e.g. to `kube-ovn`).

---

## 4. Optional

- **Limit hosts:** `ansible-playbook -i inventory/hosts playbooks/ascendra-environment/k8s-cluster-deploy.yml --limit masters`
- **Tags:** playbooks use tags (e.g. `bootstrap`, `prerequisites`, `master`, `workers`); use `--tags` / `--skip-tags` as needed.
- **Extra vars:** `-e key=value` overrides group_vars.
