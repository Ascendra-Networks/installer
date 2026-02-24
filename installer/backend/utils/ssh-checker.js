import { spawn } from 'child_process';

/**
 * Check if SSH is available on a host.
 * Supports both key-based auth (privateKeyPath) and password auth (password).
 */
function checkSSH(host, privateKeyPath, user = 'ubuntu', timeout = 5000, password = null) {
  return new Promise((resolve) => {
    let cmd, args;

    if (password) {
      cmd = 'sshpass';
      args = [
        '-p', password,
        'ssh',
        '-o', 'ConnectTimeout=5',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        `${user}@${host}`,
        'exit'
      ];
    } else {
      cmd = 'ssh';
      args = [
        '-i', privateKeyPath,
        '-o', 'ConnectTimeout=5',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'BatchMode=yes',
        `${user}@${host}`,
        'exit'
      ];
    }

    const ssh = spawn(cmd, args);

    let errorOutput = '';
    
    ssh.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ssh.kill();
        if (errorOutput) {
          console.log(`[SSH] Error connecting to ${host}: ${errorOutput.split('\n')[0]}`);
        }
        resolve(false);
      }
    }, timeout);

    ssh.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (code !== 0 && errorOutput) {
          console.log(`[SSH] Failed to connect to ${host} (exit code ${code}): ${errorOutput.split('\n').slice(0, 2).join(' ')}`);
        }
        resolve(code === 0);
      }
    });

    ssh.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        console.log(`[SSH] Spawn error for ${host}: ${err.message}`);
        resolve(false);
      }
    });
  });
}

/**
 * Wait for SSH to be ready on all hosts.
 * Pass password for password-based auth, or privateKeyPath for key-based auth.
 */
async function waitForSSHReady(hosts, privateKeyPath, user = 'ubuntu', maxWaitMinutes = 5, password = null) {
  console.log(`[SSH] Waiting for SSH to be ready on ${hosts.length} hosts...`);
  const maxAttempts = maxWaitMinutes * 12;
  const checkInterval = 5000;
  
  const readyHosts = new Set();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[SSH] Check attempt ${attempt}/${maxAttempts}`);
    
    const checks = hosts.map(async (host) => {
      if (readyHosts.has(host)) {
        return { host, ready: true };
      }
      
      const ready = await checkSSH(host, privateKeyPath, user, 5000, password);
      if (ready) {
        console.log(`[SSH] ${host} is ready`);
        readyHosts.add(host);
      }
      return { host, ready };
    });
    
    await Promise.all(checks);
    
    if (readyHosts.size === hosts.length) {
      console.log(`[SSH] All ${hosts.length} hosts are ready!`);
      return true;
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  const notReady = hosts.filter(h => !readyHosts.has(h));
  console.error(`[SSH] Timeout: ${notReady.length} hosts not ready: ${notReady.join(', ')}`);
  return false;
}

export {
  checkSSH,
  waitForSSHReady
};

