import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ascendra Installer API',
      version: '1.0.0',
      description: 'Backend-for-Frontend API for the Ascendra cluster deployment installer. Orchestrates Terraform and Ansible to provision infrastructure on AWS or on-premise environments.',
      contact: {
        name: 'Ascendra'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API server'
      }
    ],
    tags: [
      { name: 'Region', description: 'AWS region operations' },
      { name: 'VPC', description: 'Virtual Private Cloud operations' },
      { name: 'Subnet', description: 'Subnet operations' },
      { name: 'Machine Type', description: 'EC2 instance type operations' },
      { name: 'Availability Zone', description: 'Availability zone operations' },
      { name: 'Credential', description: 'AWS credential management' },
      { name: 'Cache', description: 'AWS API cache management' },
      { name: 'Config', description: 'On-premise configuration validation and templates' },
      { name: 'SSH', description: 'SSH connectivity and key management' },
      { name: 'Deployment', description: 'Deployment lifecycle management' },
      { name: 'Defaults', description: 'Cluster configuration defaults' },
      { name: 'Health', description: 'Server health check' }
    ],
    'x-tagGroups': [
      {
        name: 'AWS',
        tags: ['Region', 'VPC', 'Subnet', 'Machine Type', 'Availability Zone', 'Credential', 'Cache']
      },
      {
        name: 'On-Premise',
        tags: ['Config', 'SSH']
      },
      {
        name: 'Deployment',
        tags: ['Deployment']
      },
      {
        name: 'Configuration',
        tags: ['Defaults']
      },
      {
        name: 'System',
        tags: ['Health']
      }
    ]
  },
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
