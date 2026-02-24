import { 
  EC2Client, 
  DescribeRegionsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeAvailabilityZonesCommand,
  DescribeInstanceTypesCommand,
  DescribeInstanceTypeOfferingsCommand,
  CreateVpcCommand,
  CreateSubnetCommand,
  CreateTagsCommand,
  ModifyVpcAttributeCommand
} from '@aws-sdk/client-ec2';

/**
 * AWS Service for real AWS API integration
 */
class AWSService {
  constructor() {
    this.clients = new Map(); // Cache clients per region
    this.cache = new Map(); // Cache responses to reduce API calls
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get or create EC2 client for a specific region
   */
  getClient(region = 'us-east-1') {
    if (!this.clients.has(region)) {
      try {
        // AWS SDK v3 automatically uses credential chain:
        // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
        // 2. Shared credentials file (~/.aws/credentials)
        // 3. ECS container credentials
        // 4. EC2 instance metadata
        const client = new EC2Client({
          region
          // No need to specify credentials - SDK handles it automatically
        });
        this.clients.set(region, client);
        console.log(`[AWS] Created EC2 client for region: ${region}`);
      } catch (error) {
        console.error(`[AWS] Failed to create client for region ${region}:`, error.message);
        throw new Error(`Failed to authenticate with AWS: ${error.message}`);
      }
    }
    return this.clients.get(region);
  }

  /**
   * Get cached value or execute function and cache result
   */
  async getCached(key, fetchFn, ttl = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[AWS] Cache hit for: ${key}`);
      return cached.value;
    }

    console.log(`[AWS] Cache miss for: ${key}, fetching...`);
    const value = await fetchFn();
    this.cache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  /**
   * Get all available AWS regions
   */
  async getRegions() {
    return this.getCached('regions', async () => {
      console.log('[AWS] Fetching available regions...');
      
      try {
        const client = this.getClient('us-east-1'); // Use us-east-1 to list all regions
        const command = new DescribeRegionsCommand({
          AllRegions: false, // Only enabled regions
        });
        
        const response = await client.send(command);
        
        const regions = response.Regions
          .filter(r => r.RegionName && r.OptInStatus !== 'not-opted-in')
          .map(r => ({
            value: r.RegionName,
            label: this.getRegionDisplayName(r.RegionName),
            endpoint: r.Endpoint,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log(`[AWS] Found ${regions.length} regions`);
        return regions;
      } catch (error) {
        console.error('[AWS] Error fetching regions:', error.message);
        throw new Error(`Failed to fetch AWS regions: ${error.message}`);
      }
    });
  }

  /**
   * Get availability zones for a region
   */
  async getAvailabilityZones(region) {
    return this.getCached(`azs-${region}`, async () => {
      console.log(`[AWS] Fetching availability zones for region: ${region}`);
      
      try {
        const client = this.getClient(region);
        const command = new DescribeAvailabilityZonesCommand({
          Filters: [
            {
              Name: 'region-name',
              Values: [region],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        });
        
        const response = await client.send(command);
        
        const zones = response.AvailabilityZones
          .map(az => ({
            value: az.ZoneName,
            label: `${az.ZoneName} (${az.ZoneId})`,
            zoneId: az.ZoneId,
            state: az.State,
          }))
          .sort((a, b) => a.value.localeCompare(b.value));

        console.log(`[AWS] Found ${zones.length} availability zones in ${region}`);
        return zones;
      } catch (error) {
        console.error(`[AWS] Error fetching availability zones for ${region}:`, error.message);
        throw new Error(`Failed to fetch availability zones: ${error.message}`);
      }
    });
  }

  /**
   * Get VPCs in a specific region
   */
  async getVPCs(region) {
    return this.getCached(`vpcs-${region}`, async () => {
      console.log(`[AWS] Fetching VPCs for region: ${region}`);
      
      try {
        const client = this.getClient(region);
        const command = new DescribeVpcsCommand({});
        
        const response = await client.send(command);
        
        const vpcs = response.Vpcs
          .map(vpc => {
            // Get VPC name from tags
            const nameTag = vpc.Tags?.find(t => t.Key === 'Name');
            const name = nameTag ? nameTag.Value : 'Unnamed VPC';
            const isDefault = vpc.IsDefault ? ' (Default)' : '';
            
            return {
              value: vpc.VpcId,
              label: `${vpc.VpcId} - ${name}${isDefault}`,
              cidr: vpc.CidrBlock,
              isDefault: vpc.IsDefault,
              state: vpc.State,
            };
          })
          .sort((a, b) => {
            // Sort default VPC first
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return a.label.localeCompare(b.label);
          });

        console.log(`[AWS] Found ${vpcs.length} VPCs in ${region}`);
        return vpcs;
      } catch (error) {
        console.error(`[AWS] Error fetching VPCs for ${region}:`, error.message);
        throw new Error(`Failed to fetch VPCs: ${error.message}`);
      }
    });
  }

  /**
   * Get subnets for a specific VPC
   */
  async getSubnets(region, vpcId = null) {
    const cacheKey = vpcId ? `subnets-${region}-${vpcId}` : `subnets-${region}`;
    
    return this.getCached(cacheKey, async () => {
      console.log(`[AWS] Fetching subnets for region: ${region}${vpcId ? `, VPC: ${vpcId}` : ''}`);
      
      try {
        const client = this.getClient(region);
        const params = {};
        
        if (vpcId) {
          params.Filters = [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ];
        }
        
        const command = new DescribeSubnetsCommand(params);
        const response = await client.send(command);
        
        const subnets = response.Subnets
          .map(subnet => {
            // Get subnet name from tags
            const nameTag = subnet.Tags?.find(t => t.Key === 'Name');
            const name = nameTag ? nameTag.Value : 'Unnamed Subnet';
            
            return {
              value: subnet.SubnetId,
              label: `${subnet.SubnetId} - ${name} (${subnet.CidrBlock})`,
              cidr: subnet.CidrBlock,
              availabilityZone: subnet.AvailabilityZone,
              vpcId: subnet.VpcId,
              availableIpCount: subnet.AvailableIpAddressCount,
              state: subnet.State,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log(`[AWS] Found ${subnets.length} subnets`);
        return subnets;
      } catch (error) {
        console.error(`[AWS] Error fetching subnets:`, error.message);
        throw new Error(`Failed to fetch subnets: ${error.message}`);
      }
    });
  }

  /**
   * Get available EC2 instance types for a region
   */
  async getInstanceTypes(region) {
    return this.getCached(`instance-types-${region}`, async () => {
      console.log(`[AWS] Fetching instance types for region: ${region}`);
      
      try {
        const client = this.getClient(region);
        
        // First, get instance type offerings in the region
        const offeringsCommand = new DescribeInstanceTypeOfferingsCommand({
          LocationType: 'region',
          Filters: [
            {
              Name: 'location',
              Values: [region],
            },
          ],
        });
        
        const offeringsResponse = await client.send(offeringsCommand);
        const availableTypes = offeringsResponse.InstanceTypeOfferings.map(o => o.InstanceType);
        
        // Get details for commonly used instance types
        const commonTypes = [
          't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge',
          'm5.large', 'm5.xlarge', 'm5.2xlarge', 'm5.4xlarge',
          'c5.large', 'c5.xlarge', 'c5.2xlarge', 'c5.4xlarge',
          'c5n.large', 'c5n.xlarge', 'c5n.2xlarge', 'c5n.metal',
          'r5.large', 'r5.xlarge', 'r5.2xlarge',
        ];
        
        // Filter to only types available in this region
        const typesToQuery = commonTypes.filter(t => availableTypes.includes(t));
        
        if (typesToQuery.length === 0) {
          console.warn(`[AWS] No common instance types found in ${region}, returning all available`);
          return availableTypes.slice(0, 20).map(type => ({
            value: type,
            label: type,
            specs: 'Specs not available',
          }));
        }
        
        const command = new DescribeInstanceTypesCommand({
          InstanceTypes: typesToQuery,
        });
        
        const response = await client.send(command);
        
        const instanceTypes = response.InstanceTypes
          .map(type => {
            const vcpus = type.VCpuInfo?.DefaultVCpus || 0;
            const memory = type.MemoryInfo?.SizeInMiB ? (type.MemoryInfo.SizeInMiB / 1024).toFixed(0) : 0;
            
            return {
              value: type.InstanceType,
              label: type.InstanceType,
              specs: `${vcpus} vCPU, ${memory} GB RAM`,
              vcpus,
              memory,
              networkPerformance: type.NetworkInfo?.NetworkPerformance,
              architecture: type.ProcessorInfo?.SupportedArchitectures?.[0],
            };
          })
          .sort((a, b) => {
            // Sort by family, then by size
            const familyA = a.value.split('.')[0];
            const familyB = b.value.split('.')[0];
            if (familyA !== familyB) return familyA.localeCompare(familyB);
            return a.vcpus - b.vcpus;
          });

        console.log(`[AWS] Found ${instanceTypes.length} instance types in ${region}`);
        return instanceTypes;
      } catch (error) {
        console.error(`[AWS] Error fetching instance types:`, error.message);
        throw new Error(`Failed to fetch instance types: ${error.message}`);
      }
    }, 60 * 60 * 1000); // Cache for 1 hour (instance types don't change often)
  }

  /**
   * Get human-readable region name
   */
  getRegionDisplayName(regionCode) {
    const regionNames = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'ca-central-1': 'Canada (Central)',
      'eu-west-1': 'EU (Ireland)',
      'eu-west-2': 'EU (London)',
      'eu-west-3': 'EU (Paris)',
      'eu-central-1': 'EU (Frankfurt)',
      'eu-north-1': 'EU (Stockholm)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ap-northeast-3': 'Asia Pacific (Osaka)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'sa-east-1': 'South America (São Paulo)',
      'me-south-1': 'Middle East (Bahrain)',
      'af-south-1': 'Africa (Cape Town)',
    };
    
    return regionNames[regionCode] || regionCode;
  }

  /**
   * Validate AWS credentials
   */
  async validateCredentials(region = 'us-east-1') {
    try {
      const client = this.getClient(region);
      const command = new DescribeRegionsCommand({ MaxResults: 1 });
      await client.send(command);
      return { valid: true };
    } catch (error) {
      console.error('[AWS] Credential validation failed:', error.message);
      return { 
        valid: false, 
        error: error.message,
        suggestion: 'Run: aws configure'
      };
    }
  }

  /**
   * Create a new VPC
   * Uses same naming conventions and tags as Terraform
   */
  async createVpc(region, name, cidr) {
    console.log(`[AWS] Creating VPC in region ${region}: ${name} (${cidr})`);
    
    try {
      const client = this.getClient(region);
      
      // Extract cluster name from VPC name (assumes {cluster-name}-vpc convention)
      const clusterName = name.endsWith('-vpc') ? name.slice(0, -4) : name;
      
      // Create VPC with Terraform-aligned tags
      const createCommand = new CreateVpcCommand({
        CidrBlock: cidr,
        TagSpecifications: [
          {
            ResourceType: 'vpc',
            Tags: [
              { Key: 'Name', Value: name },
              { Key: 'ManagedBy', Value: 'Ascendra-Installer' },
              { Key: 'ClusterName', Value: clusterName }
            ]
          }
        ]
      });
      
      const createResponse = await client.send(createCommand);
      const vpcId = createResponse.Vpc.VpcId;
      
      console.log(`[AWS] VPC created: ${vpcId} with tags matching Terraform configuration`);
      
      // Enable DNS hostnames and DNS support (matches Terraform)
      const modifyCommand = new ModifyVpcAttributeCommand({
        VpcId: vpcId,
        EnableDnsHostnames: { Value: true }
      });
      
      await client.send(modifyCommand);
      console.log(`[AWS] Enabled DNS hostnames for VPC ${vpcId}`);
      
      // Clear cache so new VPC appears
      this.clearCache(`vpcs-${region}`);
      
      return {
        vpcId,
        cidr,
        name,
        clusterName
      };
    } catch (error) {
      console.error(`[AWS] Error creating VPC:`, error.message);
      throw new Error(`Failed to create VPC: ${error.message}`);
    }
  }

  /**
   * Create a new subnet
   * Uses same naming conventions and tags as Terraform
   * Note: Terraform also sets map_public_ip_on_launch = true for public subnets
   */
  async createSubnet(region, vpcId, name, cidr, availabilityZone) {
    console.log(`[AWS] Creating subnet in VPC ${vpcId}: ${name} (${cidr}) in ${availabilityZone}`);
    
    try {
      const client = this.getClient(region);
      
      // Extract cluster name from subnet name (assumes {cluster-name}-subnet convention)
      const clusterName = name.endsWith('-subnet') ? name.slice(0, -7) : name;
      
      // Create subnet with Terraform-aligned tags
      const createCommand = new CreateSubnetCommand({
        VpcId: vpcId,
        CidrBlock: cidr,
        AvailabilityZone: availabilityZone,
        TagSpecifications: [
          {
            ResourceType: 'subnet',
            Tags: [
              { Key: 'Name', Value: name },
              { Key: 'ManagedBy', Value: 'Ascendra-Installer' },
              { Key: 'ClusterName', Value: clusterName }
            ]
          }
        ]
      });
      
      const createResponse = await client.send(createCommand);
      const subnetId = createResponse.Subnet.SubnetId;
      
      console.log(`[AWS] Subnet created: ${subnetId} with tags matching Terraform configuration`);
      
      // Note: To fully match Terraform, you would also need to:
      // 1. Set map_public_ip_on_launch = true (requires ModifySubnetAttribute)
      // 2. Create/attach Internet Gateway
      // 3. Create route table with 0.0.0.0/0 -> IGW route
      // 4. Associate route table with subnet
      // These are typically handled by Terraform when it creates the full network stack
      
      // Clear cache so new subnet appears
      this.clearCache(`subnets-${region}`);
      this.clearCache(`subnets-${region}-${vpcId}`);
      
      return {
        subnetId,
        vpcId,
        cidr,
        availabilityZone,
        name,
        clusterName
      };
    } catch (error) {
      console.error(`[AWS] Error creating subnet:`, error.message);
      throw new Error(`Failed to create subnet: ${error.message}`);
    }
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
      console.log(`[AWS] Cleared cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('[AWS] Cleared all cache');
    }
  }
}

export default new AWSService();

