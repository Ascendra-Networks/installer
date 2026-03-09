# ── Stage 1: tools ──────────────────────────────────────────────────────────
# Install all execution tools (ansible, terraform, kubectl, helm, ssh) on Ubuntu.
FROM ubuntu:22.04 AS tools

ENV DEBIAN_FRONTEND=noninteractive
ENV TERRAFORM_VERSION=1.9.8
ENV KUBECTL_VERSION=v1.31.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    ca-certificates \
    lsb-release \
    python3 \
    python3-pip \
    openssh-client \
    git \
    jq \
    unzip \
  && pip3 install --no-cache-dir ansible \
  # Terraform via HashiCorp apt repo
  && curl -fsSL https://apt.releases.hashicorp.com/gpg \
       | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
       https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
       > /etc/apt/sources.list.d/hashicorp.list \
  && apt-get update && apt-get install -y --no-install-recommends terraform \
  # kubectl
  && curl -fsSL -o /usr/local/bin/kubectl \
       "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
  && chmod +x /usr/local/bin/kubectl \
  # Helm
  && curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash \
  && rm -rf /var/lib/apt/lists/*

# ── Stage 2: app ─────────────────────────────────────────────────────────────
# Add Node.js and the installer backend on top of the tools layer.
FROM tools AS app

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
