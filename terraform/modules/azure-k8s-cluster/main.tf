# Variables
variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "master_count" {
  description = "Number of master nodes"
  type        = number
  default     = 1
}

variable "worker_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 3
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 100
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  default     = ""
}

variable "admin_username" {
  description = "Admin username for VMs"
  type        = string
  default     = "ubuntu"
}

# Resource Group
resource "azurerm_resource_group" "k8s_rg" {
  name     = "${var.cluster_name}-rg"
  location = var.location

  tags = {
    Environment = "kubernetes"
    ManagedBy   = "terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "k8s_vnet" {
  name                = "${var.cluster_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name
}

# Subnet
resource "azurerm_subnet" "k8s_subnet" {
  name                 = "${var.cluster_name}-subnet"
  resource_group_name  = azurerm_resource_group.k8s_rg.name
  virtual_network_name = azurerm_virtual_network.k8s_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Network Security Group
resource "azurerm_network_security_group" "k8s_nsg" {
  name                = "${var.cluster_name}-nsg"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "K8sAPI"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllInternal"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "10.0.0.0/16"
  }
}

# Public IPs for Masters
resource "azurerm_public_ip" "k8s_master_pip" {
  count               = var.master_count
  name                = "${var.cluster_name}-master-${count.index + 1}-pip"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# NICs for Masters
resource "azurerm_network_interface" "k8s_master_nic" {
  count               = var.master_count
  name                = "${var.cluster_name}-master-${count.index + 1}-nic"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.k8s_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.k8s_master_pip[count.index].id
  }
}

resource "azurerm_network_interface_security_group_association" "k8s_master_nic_nsg" {
  count                     = var.master_count
  network_interface_id      = azurerm_network_interface.k8s_master_nic[count.index].id
  network_security_group_id = azurerm_network_security_group.k8s_nsg.id
}

# Master VMs
resource "azurerm_linux_virtual_machine" "k8s_master" {
  count               = var.master_count
  name                = "${var.cluster_name}-master-${count.index + 1}"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.k8s_master_nic[count.index].id
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key != "" ? var.ssh_public_key : file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = var.disk_size_gb
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  computer_name = "k8s-master-${count.index + 1}"

  custom_data = base64encode(<<-EOF
              #!/bin/bash
              hostnamectl set-hostname k8s-master-${count.index + 1}
              EOF
  )

  tags = {
    Role = "master"
  }
}

# Public IPs for Workers
resource "azurerm_public_ip" "k8s_worker_pip" {
  count               = var.worker_count
  name                = "${var.cluster_name}-worker-${count.index + 1}-pip"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# NICs for Workers
resource "azurerm_network_interface" "k8s_worker_nic" {
  count               = var.worker_count
  name                = "${var.cluster_name}-worker-${count.index + 1}-nic"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.k8s_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.k8s_worker_pip[count.index].id
  }
}

resource "azurerm_network_interface_security_group_association" "k8s_worker_nic_nsg" {
  count                     = var.worker_count
  network_interface_id      = azurerm_network_interface.k8s_worker_nic[count.index].id
  network_security_group_id = azurerm_network_security_group.k8s_nsg.id
}

# Worker VMs
resource "azurerm_linux_virtual_machine" "k8s_worker" {
  count               = var.worker_count
  name                = "${var.cluster_name}-worker-${count.index + 1}"
  location            = azurerm_resource_group.k8s_rg.location
  resource_group_name = azurerm_resource_group.k8s_rg.name
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.k8s_worker_nic[count.index].id
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key != "" ? var.ssh_public_key : file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = var.disk_size_gb
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  computer_name = "k8s-worker-${count.index + 1}"

  custom_data = base64encode(<<-EOF
              #!/bin/bash
              hostnamectl set-hostname k8s-worker-${count.index + 1}
              EOF
  )

  tags = {
    Role = "worker"
  }
}

