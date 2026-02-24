variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "availability_zone" {
  description = "AWS availability zone"
  type        = string
}

variable "master_instance_type" {
  description = "Instance type for master nodes"
  type        = string
}

variable "worker_instance_type" {
  description = "Instance type for worker nodes (deprecated - use worker_instances_type)"
  type        = string
  default     = ""
}

variable "worker_count" {
  description = "Number of worker nodes (deprecated - use worker_instances_type)"
  type        = number
  default     = 0
}

variable "worker_instances_type" {
  description = "DEPRECATED: Use worker_instances instead. Map of worker instance types to their counts."
  type        = map(number)
  default     = {}
}

variable "worker_instance_amis" {
  description = "DEPRECATED: Use worker_instances instead. Map of instance types to custom AMI IDs."
  type        = map(string)
  default     = {}
}

variable "worker_instances" {
  description = <<-EOT
    Map of worker configurations. Each entry is an object with:
    - type: Instance type (required)
    - count: Number of instances (required)
    - ami: Custom AMI ID (optional - if not specified, uses default Ubuntu x86_64 AMI)
    
    Example:
    {
      "group-1" = { type = "t3.large", count = 2 }
      "group-2" = { type = "c6g.large", count = 1, ami = "ami-arm64-id" }
    }
  EOT
  type = map(object({
    type  = string
    count = number
    ami   = optional(string)
  }))
  default = {}
}

variable "vpc_id" {
  description = "Existing VPC ID to use (if empty, a new VPC will be created)"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Existing Subnet ID to use (if empty, a new subnet will be created)"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for VPC (only used if creating new VPC). Default loaded from config/cluster-defaults.json"
  type        = string
  default     = ""  # Will use default from cluster-defaults.json if empty
}

variable "subnet_cidr" {
  description = "CIDR block for subnet (only used if creating new subnet). Default loaded from config/cluster-defaults.json"
  type        = string
  default     = ""  # Will use default from cluster-defaults.json if empty
}

variable "placement_group_strategy" {
  description = <<-EOT
    Placement group strategy for worker nodes. Valid values:
    - ""        : No placement group (default)
    - "cluster" : Pack instances close together for low-latency networking
    - "spread"  : Place instances on distinct hardware to reduce correlated failures
    - "partition" : Divide instances into logical partitions on separate racks
  EOT
  type    = string
  default = ""

  validation {
    condition     = contains(["", "cluster", "spread", "partition"], var.placement_group_strategy)
    error_message = "placement_group_strategy must be one of: \"\", \"cluster\", \"spread\", \"partition\"."
  }
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
  default     = ""
}

