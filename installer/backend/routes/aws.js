import express from 'express';
import awsService from '../services/aws.service.js';
import { REGIONS, MACHINE_TYPES, VPC_OPTIONS, SUBNET_OPTIONS } from '../services/mock-data.js';
import { asyncErrorHandler } from '../utils/error-handler.js';

const router = express.Router();

/**
 * @openapi
 * /aws/region/list:
 *   get:
 *     tags: [Region]
 *     summary: List AWS regions
 *     description: Returns available AWS regions. Fetches from the AWS API, falls back to mock data on failure.
 *     responses:
 *       200:
 *         description: List of regions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     example: us-east-1
 *                   label:
 *                     type: string
 *                     example: US East (N. Virginia)
 */
router.get('/region/list', asyncErrorHandler(async (req, res) => {
  try {
    const regions = await awsService.getRegions();
    return res.json(regions);
  } catch (error) {
    console.warn('[API] Failed to fetch real AWS regions, falling back to mock data:', error.message);
    return res.json(REGIONS['aws'] || []);
  }
}));

/**
 * @openapi
 * /aws/vpc/list:
 *   get:
 *     tags: [VPC]
 *     summary: List VPCs
 *     description: Returns VPCs for a given AWS region. Falls back to mock data on failure.
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: AWS region (e.g. us-east-1)
 *     responses:
 *       200:
 *         description: List of VPCs
 *       400:
 *         description: Missing region parameter
 */
router.get('/vpc/list', asyncErrorHandler(async (req, res) => {
  const { region } = req.query;

  if (!region) {
    return res.status(400).json({ error: 'region query parameter is required' });
  }

  try {
    const vpcs = await awsService.getVPCs(region);
    return res.json(vpcs);
  } catch (error) {
    console.warn('[API] Failed to fetch real AWS VPCs, falling back to mock data:', error.message);
    return res.json(VPC_OPTIONS['aws'] || []);
  }
}));

/**
 * @openapi
 * /aws/vpc/create:
 *   post:
 *     tags: [VPC]
 *     summary: Create a new VPC
 *     description: Creates a new Virtual Private Cloud with Terraform-aligned tags.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [region, name, cidr]
 *             properties:
 *               region:
 *                 type: string
 *                 example: us-east-1
 *               name:
 *                 type: string
 *                 example: my-cluster-vpc
 *               cidr:
 *                 type: string
 *                 example: 10.0.0.0/16
 *     responses:
 *       200:
 *         description: VPC created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vpcId:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create VPC
 */
router.post('/vpc/create', asyncErrorHandler(async (req, res) => {
  const { region, name, cidr } = req.body;

  if (!region || !name || !cidr) {
    return res.status(400).json({ error: 'region, name, and cidr are required' });
  }

  try {
    const result = await awsService.createVpc(region, name, cidr);
    res.json(result);
  } catch (error) {
    console.error('[API] Failed to create VPC:', error.message);
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @openapi
 * /aws/subnet/list:
 *   get:
 *     tags: [Subnet]
 *     summary: List subnets
 *     description: Returns subnets for a given AWS region, optionally filtered by VPC. Falls back to mock data on failure.
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: AWS region (e.g. us-east-1)
 *       - in: query
 *         name: vpcId
 *         schema:
 *           type: string
 *         description: Filter by VPC ID (optional)
 *     responses:
 *       200:
 *         description: List of subnets
 *       400:
 *         description: Missing region parameter
 */
router.get('/subnet/list', asyncErrorHandler(async (req, res) => {
  const { region, vpcId } = req.query;

  if (!region) {
    return res.status(400).json({ error: 'region query parameter is required' });
  }

  try {
    const subnets = await awsService.getSubnets(region, vpcId);
    return res.json(subnets);
  } catch (error) {
    console.warn('[API] Failed to fetch real AWS subnets, falling back to mock data:', error.message);
    return res.json(SUBNET_OPTIONS['aws'] || []);
  }
}));

/**
 * @openapi
 * /aws/subnet/create:
 *   post:
 *     tags: [Subnet]
 *     summary: Create a new subnet
 *     description: Creates a new subnet within an existing VPC.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [region, vpcId, name, cidr, availabilityZone]
 *             properties:
 *               region:
 *                 type: string
 *                 example: us-east-1
 *               vpcId:
 *                 type: string
 *                 example: vpc-0123456789abcdef0
 *               name:
 *                 type: string
 *                 example: my-cluster-subnet
 *               cidr:
 *                 type: string
 *                 example: 10.0.1.0/24
 *               availabilityZone:
 *                 type: string
 *                 example: us-east-1a
 *     responses:
 *       200:
 *         description: Subnet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subnetId:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create subnet
 */
router.post('/subnet/create', asyncErrorHandler(async (req, res) => {
  const { region, vpcId, name, cidr, availabilityZone } = req.body;

  if (!region || !vpcId || !name || !cidr || !availabilityZone) {
    return res.status(400).json({
      error: 'region, vpcId, name, cidr, and availabilityZone are required'
    });
  }

  try {
    const result = await awsService.createSubnet(region, vpcId, name, cidr, availabilityZone);
    res.json(result);
  } catch (error) {
    console.error('[API] Failed to create subnet:', error.message);
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @openapi
 * /aws/machine-type/list:
 *   get:
 *     tags: [Machine Type]
 *     summary: List EC2 instance types
 *     description: Returns available EC2 instance types for a given region. Falls back to mock data on failure.
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: AWS region (e.g. us-east-1)
 *     responses:
 *       200:
 *         description: List of instance types with specs
 *       400:
 *         description: Missing region parameter
 */
router.get('/machine-type/list', asyncErrorHandler(async (req, res) => {
  const { region } = req.query;

  if (!region) {
    return res.status(400).json({ error: 'region query parameter is required' });
  }

  try {
    const instanceTypes = await awsService.getInstanceTypes(region);
    return res.json(instanceTypes);
  } catch (error) {
    console.warn('[API] Failed to fetch real AWS instance types, falling back to mock data:', error.message);
    return res.json(MACHINE_TYPES['aws'] || []);
  }
}));

/**
 * @openapi
 * /aws/availability-zone/list:
 *   get:
 *     tags: [Availability Zone]
 *     summary: List availability zones
 *     description: Returns availability zones for a given AWS region.
 *     parameters:
 *       - in: query
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *         description: AWS region (e.g. us-east-1)
 *     responses:
 *       200:
 *         description: List of availability zones
 *       400:
 *         description: Missing region parameter
 *       500:
 *         description: Failed to fetch availability zones
 */
router.get('/availability-zone/list', asyncErrorHandler(async (req, res) => {
  const { region } = req.query;

  if (!region) {
    return res.status(400).json({ error: 'region query parameter is required' });
  }

  try {
    const zones = await awsService.getAvailabilityZones(region);
    res.json(zones);
  } catch (error) {
    console.error('[API] Failed to fetch availability zones:', error.message);
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @openapi
 * /aws/credential/validate:
 *   get:
 *     tags: [Credential]
 *     summary: Validate AWS credentials
 *     description: Checks whether the configured AWS credentials are valid and accessible.
 *     responses:
 *       200:
 *         description: Credentials are valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Credentials are invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 suggestion:
 *                   type: string
 */
router.get('/credential/validate', asyncErrorHandler(async (req, res) => {
  const result = await awsService.validateCredentials();

  if (result.valid) {
    res.json({ valid: true, message: 'AWS credentials are valid' });
  } else {
    res.status(401).json({
      valid: false,
      error: result.error,
      suggestion: result.suggestion
    });
  }
}));

/**
 * @openapi
 * /aws/cache/clear:
 *   post:
 *     tags: [Cache]
 *     summary: Clear AWS API cache
 *     description: Clears cached AWS API responses. Optionally clear only a specific cache key.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Specific cache key to clear (omit to clear all)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/cache/clear', asyncErrorHandler(async (req, res) => {
  const { key } = req.body;
  awsService.clearCache(key);
  res.json({ message: key ? `Cache cleared for: ${key}` : 'All cache cleared' });
}));

export default router;
