import express from 'express';
import onPremiseService from '../services/onpremise.service.js';
import { asyncErrorHandler } from '../utils/error-handler.js';

const router = express.Router();

/**
 * @openapi
 * /onpremise/config/validate:
 *   post:
 *     tags: [Config]
 *     summary: Validate on-premise configuration
 *     description: Validates an on-premise cluster configuration provided as JSON or YAML. Checks node IPs, hostnames, SSH settings, and group structure.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: On-premise configuration as JSON
 *               yaml:
 *                 type: string
 *                 description: On-premise configuration as YAML string
 *     responses:
 *       200:
 *         description: Configuration is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 config:
 *                   type: object
 *       400:
 *         description: Configuration is invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/config/validate', asyncErrorHandler(async (req, res) => {
  const { config, yaml: yamlContent } = req.body;

  try {
    let configToValidate = config;

    if (yamlContent) {
      const parseResult = onPremiseService.parseYAML(yamlContent);
      if (!parseResult.success) {
        return res.status(400).json({
          valid: false,
          error: parseResult.error
        });
      }
      configToValidate = parseResult.config;
    }

    if (!configToValidate) {
      return res.status(400).json({
        valid: false,
        error: 'No configuration provided. Send either "config" (JSON) or "yaml" (string)'
      });
    }

    const validation = onPremiseService.validateConfig(configToValidate);

    if (validation.valid) {
      res.json({
        valid: true,
        message: 'Configuration is valid',
        config: configToValidate
      });
    } else {
      res.status(400).json(validation);
    }
  } catch (error) {
    console.error('[API] On-premise config validation error:', error.message);
    res.status(500).json({
      valid: false,
      error: error.message
    });
  }
}));

/**
 * @openapi
 * /onpremise/config/template:
 *   get:
 *     tags: [Config]
 *     summary: Download YAML configuration template
 *     description: Returns a YAML template file for on-premise cluster configuration.
 *     responses:
 *       200:
 *         description: YAML template file
 *         content:
 *           text/yaml:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to generate template
 */
router.get('/config/template', (req, res) => {
  try {
    const template = onPremiseService.getConfigTemplate();

    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Disposition', 'attachment; filename="onpremise-cluster-template.yaml"');
    res.send(template);
  } catch (error) {
    console.error('[API] Failed to get config template:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /onpremise/ssh/validate:
 *   post:
 *     tags: [SSH]
 *     summary: Test SSH connectivity
 *     description: Tests SSH connectivity to all nodes defined in the on-premise configuration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [config]
 *             properties:
 *               config:
 *                 type: object
 *                 description: On-premise configuration with node details
 *               timeout:
 *                 type: integer
 *                 default: 10
 *                 description: SSH connection timeout in seconds
 *     responses:
 *       200:
 *         description: All SSH connections successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tested:
 *                   type: integer
 *                 passed:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid configuration or SSH failures
 *       500:
 *         description: SSH validation error
 */
router.post('/ssh/validate', asyncErrorHandler(async (req, res) => {
  const { config, timeout = 10 } = req.body;

  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'Configuration is required'
    });
  }

  try {
    const validation = onPremiseService.validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Invalid configuration: ${validation.error}`
      });
    }

    const result = await onPremiseService.testAllSSHConnections(config, timeout);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[API] SSH validation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

export default router;
