/**
 * Mock data for cloud providers, regions, machine types, etc.
 * This data is used by the API to provide options to the frontend
 */

const CLOUD_PROVIDERS = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Deploy on AWS cloud infrastructure',
    icon: 'aws'
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Deploy on Azure cloud platform',
    icon: 'azure'
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Deploy on Google Cloud infrastructure',
    icon: 'gcp'
  },
  {
    id: 'on-premise',
    name: 'On-Premise',
    description: 'Deploy on your existing physical infrastructure',
    icon: 'server'
  }
];

const REGIONS = {
  aws: [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
  ],
  azure: [
    { value: 'eastus', label: 'East US' },
    { value: 'westus2', label: 'West US 2' },
    { value: 'westeurope', label: 'West Europe' },
    { value: 'southeastasia', label: 'Southeast Asia' }
  ],
  gcp: [
    { value: 'us-central1', label: 'US Central (Iowa)' },
    { value: 'us-west1', label: 'US West (Oregon)' },
    { value: 'europe-west1', label: 'Europe West (Belgium)' },
    { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' }
  ],
  'on-premises': [
    { value: 'datacenter-1', label: 'Data Center 1' },
    { value: 'datacenter-2', label: 'Data Center 2' },
    { value: 'custom', label: 'Custom Location' }
  ]
};

const VPC_OPTIONS = {
  aws: [
    { value: 'vpc-0a1b2c3d4e5f', label: 'vpc-0a1b2c3d4e5f (Default VPC)' },
    { value: 'vpc-1a2b3c4d5e6f', label: 'vpc-1a2b3c4d5e6f (Production VPC)' },
    { value: 'vpc-2a3b4c5d6e7f', label: 'vpc-2a3b4c5d6e7f (Staging VPC)' }
  ],
  azure: [
    { value: 'vnet-prod-001', label: 'vnet-prod-001 (Production)' },
    { value: 'vnet-dev-001', label: 'vnet-dev-001 (Development)' },
    { value: 'vnet-staging-001', label: 'vnet-staging-001 (Staging)' }
  ],
  gcp: [
    { value: 'default', label: 'default (Default Network)' },
    { value: 'prod-network', label: 'prod-network (Production)' },
    { value: 'dev-network', label: 'dev-network (Development)' }
  ],
  'on-premises': [
    { value: 'network-1', label: 'Network 1 (192.168.1.0/24)' },
    { value: 'network-2', label: 'Network 2 (192.168.2.0/24)' },
    { value: 'network-3', label: 'Network 3 (10.0.0.0/16)' }
  ]
};

const SUBNET_OPTIONS = {
  aws: [
    { value: 'subnet-0a1b2c3d', label: 'subnet-0a1b2c3d (us-east-1a)' },
    { value: 'subnet-1a2b3c4d', label: 'subnet-1a2b3c4d (us-east-1b)' },
    { value: 'subnet-2a3b4c5d', label: 'subnet-2a3b4c5d (us-east-1c)' }
  ],
  azure: [
    { value: 'subnet-prod-01', label: 'subnet-prod-01 (10.0.1.0/24)' },
    { value: 'subnet-prod-02', label: 'subnet-prod-02 (10.0.2.0/24)' },
    { value: 'subnet-dev-01', label: 'subnet-dev-01 (10.1.1.0/24)' }
  ],
  gcp: [
    { value: 'default', label: 'default (10.128.0.0/20)' },
    { value: 'subnet-a', label: 'subnet-a (10.0.0.0/24)' },
    { value: 'subnet-b', label: 'subnet-b (10.0.1.0/24)' }
  ],
  'on-premises': [
    { value: 'subnet-1', label: 'Subnet 1 (192.168.1.0/24)' },
    { value: 'subnet-2', label: 'Subnet 2 (192.168.2.0/24)' },
    { value: 'subnet-3', label: 'Subnet 3 (10.0.1.0/24)' }
  ]
};

const MACHINE_TYPES = {
  aws: [
    { value: 't3.medium', label: 't3.medium', specs: '2 vCPU, 4 GB RAM' },
    { value: 't3.large', label: 't3.large', specs: '2 vCPU, 8 GB RAM' },
    { value: 'm5.xlarge', label: 'm5.xlarge', specs: '4 vCPU, 16 GB RAM' },
    { value: 'm5.2xlarge', label: 'm5.2xlarge', specs: '8 vCPU, 32 GB RAM' },
    { value: 'c5n.metal', label: 'c5n.metal', specs: '72 vCPU, 192 GB RAM' }
  ],
  azure: [
    { value: 'Standard_B2s', label: 'Standard B2s', specs: '2 vCPU, 4 GB RAM' },
    { value: 'Standard_D2s_v3', label: 'Standard D2s v3', specs: '2 vCPU, 8 GB RAM' },
    { value: 'Standard_D4s_v3', label: 'Standard D4s v3', specs: '4 vCPU, 16 GB RAM' },
    { value: 'Standard_D8s_v3', label: 'Standard D8s v3', specs: '8 vCPU, 32 GB RAM' }
  ],
  gcp: [
    { value: 'n1-standard-2', label: 'n1-standard-2', specs: '2 vCPU, 7.5 GB RAM' },
    { value: 'n1-standard-4', label: 'n1-standard-4', specs: '4 vCPU, 15 GB RAM' },
    { value: 'n2-standard-4', label: 'n2-standard-4', specs: '4 vCPU, 16 GB RAM' },
    { value: 'n2-standard-8', label: 'n2-standard-8', specs: '8 vCPU, 32 GB RAM' }
  ],
  'on-premises': [
    { value: 'small', label: 'Small', specs: '2 vCPU, 4 GB RAM' },
    { value: 'medium', label: 'Medium', specs: '4 vCPU, 8 GB RAM' },
    { value: 'large', label: 'Large', specs: '8 vCPU, 16 GB RAM' },
    { value: 'xlarge', label: 'X-Large', specs: '16 vCPU, 32 GB RAM' }
  ]
};

export {
  CLOUD_PROVIDERS,
  REGIONS,
  VPC_OPTIONS,
  SUBNET_OPTIONS,
  MACHINE_TYPES
};

