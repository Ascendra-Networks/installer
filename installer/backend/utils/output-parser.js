const RESOURCE_FRIENDLY_NAMES = [
  { match: /aws_vpc/,               msg: 'Creating private network...' },
  { match: /aws_internet_gateway/,  msg: 'Setting up internet gateway...' },
  { match: /aws_subnet/,            msg: 'Creating subnet...' },
  { match: /aws_route_table|aws_route\b/, msg: 'Configuring network routes...' },
  { match: /aws_security_group/,    msg: 'Configuring security rules...' },
  { match: /tls_private_key/,       msg: 'Generating encryption keys...' },
  { match: /aws_key_pair/,          msg: 'Registering access keys...' },
  { match: /local_file.*key/,       msg: 'Saving access keys...' },
  { match: /aws_instance.*master/i, msg: 'Launching master machine...' },
  { match: /aws_instance.*worker/i, msg: 'Launching worker machine...' },
  { match: /aws_instance/,          msg: 'Launching machine...' },
  { match: /aws_placement_group/,   msg: 'Configuring placement strategy...' },
  { match: /null_resource/,         msg: 'Running provisioner...' },
  { match: /local_file/,            msg: 'Saving configuration...' },
];

function getResourceFriendlyMessage(resourceName) {
  if (!resourceName) return null;
  for (const rule of RESOURCE_FRIENDLY_NAMES) {
    if (rule.match.test(resourceName)) {
      return rule.msg;
    }
  }
  return null;
}

/**
 * Parse Terraform output to extract progress information.
 * Handles both stdout and stderr lines.
 */
function parseTerraformOutput(line) {
  const result = {
    type: 'terraform',
    raw: line,
    event: null,
    resource: null,
    message: null,
    friendlyMessage: null,
    isError: false,
    isComplete: false
  };

  if (line.match(/^Error:/i) || line.match(/^│ Error:/)) {
    result.isError = true;
    result.event = 'error';
    result.message = line;
    return result;
  }

  // ── Init phase ──
  if (line.match(/Initializing the backend/i)) {
    result.event = 'init_backend';
    result.message = 'Setting up state backend...';
    return result;
  }
  if (line.match(/Initializing provider plugins/i)) {
    result.event = 'init_providers';
    result.message = 'Loading provider plugins...';
    return result;
  }
  if (line.match(/Installing hashicorp/i) || line.match(/- Installing/i)) {
    const providerMatch = line.match(/Installing ([\w/.-]+)/i);
    const name = providerMatch ? providerMatch[1].split('/').pop() : 'provider';
    result.event = 'init_installing';
    result.message = `Downloading ${name} plugin...`;
    return result;
  }
  if (line.match(/Installed hashicorp/i) || line.match(/- Installed/i)) {
    result.event = 'init_installed';
    result.message = 'Provider plugin installed';
    return result;
  }
  if (line.match(/Initializing modules/i)) {
    result.event = 'init_modules';
    result.message = 'Loading infrastructure modules...';
    return result;
  }
  if (line.match(/successfully initialized/i)) {
    result.event = 'init_complete';
    result.message = 'Initialization complete';
    return result;
  }
  if (line.match(/Finding.*versions/i)) {
    const pkg = line.match(/Finding ([\w/.-]+)/i);
    const name = pkg ? pkg[1].split('/').pop() : 'provider';
    result.event = 'init_finding';
    result.message = `Resolving ${name} version...`;
    return result;
  }
  if (line.match(/Using previously-installed/i)) {
    result.event = 'init_cached';
    result.message = 'Using cached provider...';
    return result;
  }
  if (line.match(/Reusing previous version/i)) {
    result.event = 'init_reuse';
    result.message = 'Reusing provider configuration...';
    return result;
  }
  if (line.match(/Partner and community providers/i)) {
    result.event = 'init_partner';
    result.message = 'Verifying provider signatures...';
    return result;
  }
  if (line.match(/Lock file/i) || line.match(/\.terraform\.lock/i)) {
    result.event = 'init_lock';
    result.message = 'Locking provider versions...';
    return result;
  }

  // ── Plan phase ──
  if (line.match(/Refreshing.*state/i) || line.match(/Reading\.\.\./i)) {
    result.event = 'plan_refresh';
    result.message = 'Reading current infrastructure state...';
    return result;
  }
  if (line.match(/data\..*: Reading/i) || line.match(/data\..*: Read complete/i)) {
    result.event = 'plan_data';
    result.message = 'Checking existing resources...';
    return result;
  }
  if (line.match(/will be created/i)) {
    result.event = 'plan_create';
    result.message = 'Calculating resources to create...';
    return result;
  }
  if (line.match(/will be updated/i) || line.match(/will be modified/i)) {
    result.event = 'plan_update';
    result.message = 'Identifying resources to update...';
    return result;
  }
  if (line.match(/will be destroyed/i)) {
    result.event = 'plan_destroy';
    result.message = 'Identifying resources to remove...';
    return result;
  }
  if (line.match(/must be replaced/i)) {
    result.event = 'plan_replace';
    result.message = 'Marking resources for replacement...';
    return result;
  }
  // Refreshing state for a specific resource (stderr during plan)
  const refreshMatch = line.match(/([\w_.[\]"'-]+): Refreshing state/);
  if (refreshMatch) {
    const friendly = getResourceFriendlyMessage(refreshMatch[1]);
    result.event = 'plan_refresh_resource';
    result.message = friendly
      ? friendly.replace('Creating', 'Checking').replace('...', ' state...')
      : 'Refreshing resource state...';
    return result;
  }

  // ── Apply phase ──
  const creatingMatch = line.match(/([\w_.[\]"'-]+): Creating\.\.\./);
  if (creatingMatch) {
    result.event = 'creating';
    result.resource = creatingMatch[1];
    result.friendlyMessage = getResourceFriendlyMessage(creatingMatch[1]);
    result.message = result.friendlyMessage || 'Creating resource...';
    return result;
  }

  const stillCreatingMatch = line.match(/([\w_.[\]"'-]+): Still creating\.\.\. \[(.+?)\]/);
  if (stillCreatingMatch) {
    result.event = 'still_creating';
    result.resource = stillCreatingMatch[1];
    result.friendlyMessage = getResourceFriendlyMessage(stillCreatingMatch[1]);
    const elapsed = stillCreatingMatch[2];
    result.message = result.friendlyMessage
      ? `${result.friendlyMessage.replace('...', '')} (${elapsed})...`
      : `Still creating resource (${elapsed})...`;
    return result;
  }

  const creationCompleteMatch = line.match(/([\w_.[\]"'-]+): Creation complete after (.+)/);
  if (creationCompleteMatch) {
    result.event = 'creation_complete';
    result.resource = creationCompleteMatch[1];
    result.friendlyMessage = getResourceFriendlyMessage(creationCompleteMatch[1]);
    result.message = result.friendlyMessage
      ? result.friendlyMessage.replace('...', '').replace(/ing\b/, 'ed').replace(/\.\.\.$/, '') + ' \u2713'
      : 'Resource created \u2713';
    return result;
  }

  // Provisioner outputs (remote-exec, local-exec)
  const provisionerMatch = line.match(/([\w_.[\]"'-]+): Provisioning with '([^']+)'/);
  if (provisionerMatch) {
    result.event = 'provisioning';
    result.resource = provisionerMatch[1];
    result.message = 'Running machine provisioner...';
    return result;
  }

  const provisionerOutputMatch = line.match(/([\w_.[\]"'-]+) \(remote-exec\):/);
  if (provisionerOutputMatch) {
    result.event = 'provisioner_output';
    result.resource = provisionerOutputMatch[1];
    result.message = 'Configuring machine...';
    return result;
  }

  if (line.match(/^Apply complete!/)) {
    result.isComplete = true;
    result.event = 'apply_complete';
    result.message = 'All resources created successfully';
    return result;
  }

  const planMatch = line.match(/Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/);
  if (planMatch) {
    result.event = 'plan';
    result.message = `Ready to create ${planMatch[1]} resources`;
    result.totalResources = parseInt(planMatch[1]);
    return result;
  }

  // Outputs line
  if (line.match(/^Outputs:/i)) {
    result.event = 'outputs_header';
    result.message = 'Collecting infrastructure outputs...';
    return result;
  }

  return result;
}

/**
 * Parse Ansible output to extract progress information.
 */
function parseAnsibleOutput(line, currentPlaybook) {
  const result = {
    type: 'ansible',
    raw: line,
    event: null,
    task: null,
    play: null,
    phase: null,
    message: null,
    isError: false,
    isComplete: false,
    playbook: currentPlaybook || null
  };

  if (line.match(/^fatal:/i) || line.match(/^failed:/i)) {
    result.isError = true;
    result.event = 'error';
    result.message = line;
    return result;
  }

  const playMatch = line.match(/^PLAY \[(.*?)\]/);
  if (playMatch) {
    result.event = 'play';
    result.play = playMatch[1];
    result.message = `Starting: ${playMatch[1]}`;

    if (currentPlaybook === 'tyr-deploy') {
      if (playMatch[1].includes('Phase 1')) {
        result.phase = 'helm';
      } else if (playMatch[1].includes('Phase 2')) {
        result.phase = 'configure';
      } else if (playMatch[1].includes('Phase 3')) {
        result.phase = 'secret';
      } else if (playMatch[1].includes('Phase 4')) {
        result.phase = 'deploy';
      } else if (playMatch[1].includes('Phase 5')) {
        result.phase = 'inframanager';
      } else if (playMatch[1].includes('Phase 6')) {
        result.phase = 'summary';
      }
    } else {
      if (playMatch[1].includes('Phase 1')) {
        result.phase = 'prerequisites';
      } else if (playMatch[1].includes('Phase 2')) {
        result.phase = 'master';
      } else if (playMatch[1].includes('Phase 3')) {
        result.phase = 'workers';
      } else if (playMatch[1].includes('Phase 4')) {
        result.phase = 'status';
      }
    }

    return result;
  }

  const taskMatch = line.match(/^TASK \[(.*?)\]/);
  if (taskMatch) {
    result.event = 'task';
    result.task = taskMatch[1];
    result.message = `Task: ${taskMatch[1]}`;

    if (currentPlaybook === 'tyr-deploy') {
      const taskName = taskMatch[1].toLowerCase();
      if (taskName.includes('verify all components') || taskName.includes('final check') ||
          taskName.includes('deployment summary')) {
        result.phase = 'verification';
      } else if (taskName.includes('wait for virtual compute') || taskName.includes('virtual compute')) {
        result.phase = 'kubevirt-waiting';
      } else if (taskName.includes('wait for network layer') || taskName.includes('network layer')) {
        result.phase = 'network-waiting';
      } else if (taskName.includes('kubevirt') || taskName.includes('kubeVirt') ||
          taskName.includes('wait for tyr pods') || taskName.includes('virtual')) {
        result.phase = 'kubevirt-waiting';
      }
    }

    return result;
  }

  const taskResultMatch = line.match(/^(ok|changed|failed|skipped):/);
  if (taskResultMatch) {
    result.event = `task_${taskResultMatch[1]}`;
    result.message = line;
    return result;
  }

  if (line.match(/^PLAY RECAP/)) {
    result.event = 'recap';
    result.message = 'Playbook recap';
    return result;
  }

  if (line.match(/failed=0/)) {
    result.isComplete = true;
    result.event = 'complete';
    result.message = 'Ansible playbook completed successfully';
    return result;
  }

  return result;
}

function calculateTerraformProgress(events) {
  const totalResources = events.find(e => e.totalResources)?.totalResources || 10;
  const completedResources = events.filter(e => e.event === 'creation_complete').length;

  return Math.min(100, Math.round((completedResources / totalResources) * 100));
}

function calculateAnsibleProgress(currentPhase, currentPlaybook) {
  if (currentPlaybook === 'tyr-deploy') {
    const phaseProgress = {
      'helm': 8,
      'configure': 18,
      'secret': 25,
      'deploy': 35,
      'inframanager': 50,
      'kubevirt-waiting': 65,
      'network-waiting': 78,
      'verification': 92,
      'summary': 100
    };
    return phaseProgress[currentPhase] || 0;
  }

  const phaseProgress = {
    'prerequisites': 20,
    'master': 50,
    'workers': 80,
    'status': 100
  };
  return phaseProgress[currentPhase] || 0;
}

export {
  parseTerraformOutput,
  parseAnsibleOutput,
  calculateTerraformProgress,
  calculateAnsibleProgress
};
