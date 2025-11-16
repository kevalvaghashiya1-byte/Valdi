import fs from 'fs';
import path from 'path';
import { checkCommandExists } from '../utils/cliUtils';
import {
  detectPackageManager,
  getInstallCommandWithMapping,
  getPackageManagerName,
} from '../utils/packageManagerUtils';
import { DevSetupHelper, HOME_DIR } from './DevSetupHelper';
import { ANDROID_LINUX_COMMANDLINE_TOOLS } from './versions';

const BAZELISK_URL = 'https://github.com/bazelbuild/bazelisk/releases/download/v1.26.0/bazelisk-linux-amd64';

export async function linuxSetup(): Promise<void> {
  const devSetup = new DevSetupHelper();

  // Detect the package manager
  const packageManager = detectPackageManager();
  const pmName = getPackageManagerName(packageManager);

  if (packageManager === 'unknown') {
    console.log('Warning: Could not detect package manager. Please install dependencies manually:');
    console.log('- zlib development libraries');
    console.log('- git-lfs');
    console.log('- watchman');
    console.log('- fontconfig development libraries');
    console.log('- adb (Android Debug Bridge)');
  } else {
    // Install core dependencies with automatic package name mapping
    const dependencies = ['zlib1g-dev', 'git-lfs', 'watchman', 'libfontconfig-dev', 'adb'];
    const installCmd = getInstallCommandWithMapping(dependencies, packageManager);

    await devSetup.runShell(`Installing dependencies using ${pmName}`, [installCmd]);
  }

  // libtinfo5 is Ubuntu-specific and not needed on other distributions
  // Skip this step on non-apt systems
  if (packageManager === 'apt') {
    await devSetup.runShell('Installing libtinfo5', [
      `wget http://security.ubuntu.com/ubuntu/pool/universe/n/ncurses/libtinfo5_6.3-2ubuntu0.1_amd64.deb`,
      `sudo apt install ./libtinfo5_6.3-2ubuntu0.1_amd64.deb`,
    ]);
  }

  if (!checkCommandExists('java')) {
    if (packageManager === 'unknown') {
      console.log('Warning: Please install Java Runtime Environment manually');
    } else {
      const javaInstallCmd = getInstallCommandWithMapping(['default-jre'], packageManager);
      await devSetup.runShell('Installing Java Runtime Environment', [javaInstallCmd]);
    }
  }

  const bazeliskPathSuffix = '.valdi/bin/bazelisk';
  const bazeliskTargetPath = path.join(HOME_DIR, bazeliskPathSuffix);
  await devSetup.downloadToPath(BAZELISK_URL, bazeliskTargetPath);

  // Add executable permission to the downloaded binary
  const stats = fs.statSync(bazeliskTargetPath);
  fs.chmodSync(bazeliskTargetPath, stats.mode | 0o111);

  await devSetup.writeEnvVariablesToRcFile([{ name: 'PATH', value: `"$HOME/.valdi/bin:$PATH"` }]);

  await devSetup.setupAndroidSDK(ANDROID_LINUX_COMMANDLINE_TOOLS);

  devSetup.onComplete();
}
