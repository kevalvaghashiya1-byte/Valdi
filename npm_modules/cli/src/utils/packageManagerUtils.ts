/**
 * @fileoverview Package Manager Detection and Utilities for Linux
 *
 * This module provides utilities for detecting and working with different Linux
 * package managers (apt, dnf, yum, pacman, zypper). It handles package name
 * mapping between distributions and generates appropriate install commands.
 *
 * @author Valdi Team
 */

import { checkCommandExists } from './cliUtils';

/**
 * Supported Linux package managers
 */
export type PackageManager = 'apt' | 'dnf' | 'yum' | 'pacman' | 'zypper' | 'unknown';

/**
 * Package name mappings between different distributions
 * Key is the generic/Debian package name, value is the mapping for other distros
 */
interface PackageNameMap {
  [key: string]: {
    apt?: string;
    dnf?: string;
    yum?: string;
    pacman?: string;
    zypper?: string;
  };
}

/**
 * Package name mappings for common development dependencies
 */
const PACKAGE_MAPPINGS: PackageNameMap = {
  'zlib1g-dev': {
    apt: 'zlib1g-dev',
    dnf: 'zlib-devel',
    yum: 'zlib-devel',
    pacman: 'zlib',
    zypper: 'zlib-devel',
  },
  'git-lfs': {
    apt: 'git-lfs',
    dnf: 'git-lfs',
    yum: 'git-lfs',
    pacman: 'git-lfs',
    zypper: 'git-lfs',
  },
  'watchman': {
    apt: 'watchman',
    dnf: 'watchman',
    yum: 'watchman',
    pacman: 'watchman',
    zypper: 'watchman',
  },
  'libfontconfig-dev': {
    apt: 'libfontconfig-dev',
    dnf: 'fontconfig-devel',
    yum: 'fontconfig-devel',
    pacman: 'fontconfig',
    zypper: 'fontconfig-devel',
  },
  'adb': {
    apt: 'adb',
    dnf: 'android-tools',
    yum: 'android-tools',
    pacman: 'android-tools',
    zypper: 'android-tools',
  },
  'default-jre': {
    apt: 'default-jre',
    dnf: 'java-latest-openjdk',
    yum: 'java-latest-openjdk',
    pacman: 'jre-openjdk',
    zypper: 'java-openjdk',
  },
  'openjdk-17-jdk': {
    apt: 'openjdk-17-jdk',
    dnf: 'java-17-openjdk-devel',
    yum: 'java-17-openjdk-devel',
    pacman: 'jdk17-openjdk',
    zypper: 'java-17-openjdk-devel',
  },
  'git': {
    apt: 'git',
    dnf: 'git',
    yum: 'git',
    pacman: 'git',
    zypper: 'git',
  },
};

/**
 * Detects the available package manager on the current Linux system.
 *
 * Checks for package managers in order of preference:
 * 1. apt (Debian/Ubuntu)
 * 2. dnf (Fedora, RHEL 8+, Amazon Linux 2023)
 * 3. yum (CentOS, RHEL 7)
 * 4. pacman (Arch Linux)
 * 5. zypper (openSUSE)
 *
 * @returns The detected package manager or 'unknown' if none found
 *
 * @example
 * ```typescript
 * const pm = detectPackageManager();
 * if (pm === 'dnf') {
 *   console.log('Running on Fedora/RHEL');
 * }
 * ```
 */
export function detectPackageManager(): PackageManager {
  if (checkCommandExists('apt-get')) {
    return 'apt';
  } else if (checkCommandExists('dnf')) {
    return 'dnf';
  } else if (checkCommandExists('yum')) {
    return 'yum';
  } else if (checkCommandExists('pacman')) {
    return 'pacman';
  } else if (checkCommandExists('zypper')) {
    return 'zypper';
  }
  return 'unknown';
}

/**
 * Maps a generic package name to the distribution-specific package name.
 *
 * @param genericName - The generic/Debian package name
 * @param packageManager - The target package manager
 * @returns The distribution-specific package name, or the generic name if no mapping exists
 *
 * @example
 * ```typescript
 * const pkgName = getPackageName('zlib1g-dev', 'dnf');
 * // Returns: 'zlib-devel'
 * ```
 */
export function getPackageName(genericName: string, packageManager: PackageManager): string {
  const mapping = PACKAGE_MAPPINGS[genericName];
  if (!mapping) {
    return genericName;
  }

  return mapping[packageManager] || genericName;
}

/**
 * Maps multiple generic package names to distribution-specific names.
 *
 * @param genericNames - Array of generic/Debian package names
 * @param packageManager - The target package manager
 * @returns Array of distribution-specific package names
 *
 * @example
 * ```typescript
 * const pkgs = getPackageNames(['zlib1g-dev', 'git-lfs'], 'dnf');
 * // Returns: ['zlib-devel', 'git-lfs']
 * ```
 */
export function getPackageNames(genericNames: string[], packageManager: PackageManager): string[] {
  return genericNames.map(name => getPackageName(name, packageManager));
}

/**
 * Generates an install command for the specified package manager.
 *
 * @param packages - Array of package names to install
 * @param packageManager - The package manager to use
 * @param useSudo - Whether to prefix the command with sudo (default: true)
 * @returns The complete install command string
 *
 * @example
 * ```typescript
 * const cmd = getInstallCommand(['git', 'zlib-devel'], 'dnf');
 * // Returns: 'sudo dnf install -y git zlib-devel'
 * ```
 */
export function getInstallCommand(
  packages: string[],
  packageManager: PackageManager,
  useSudo: boolean = true,
): string {
  const sudo = useSudo ? 'sudo ' : '';
  const pkgList = packages.join(' ');

  switch (packageManager) {
    case 'apt':
      return `${sudo}apt-get install -y ${pkgList}`;
    case 'dnf':
      return `${sudo}dnf install -y ${pkgList}`;
    case 'yum':
      return `${sudo}yum install -y ${pkgList}`;
    case 'pacman':
      return `${sudo}pacman -S --noconfirm ${pkgList}`;
    case 'zypper':
      return `${sudo}zypper install -y ${pkgList}`;
    default:
      return `# Unknown package manager - please install: ${pkgList}`;
  }
}

/**
 * Generates an install command with automatic package name mapping.
 *
 * This is a convenience function that combines package name mapping and
 * command generation in one step.
 *
 * @param genericPackages - Array of generic/Debian package names
 * @param packageManager - The package manager to use (if not provided, auto-detects)
 * @param useSudo - Whether to prefix the command with sudo (default: true)
 * @returns The complete install command with mapped package names
 *
 * @example
 * ```typescript
 * const cmd = getInstallCommandWithMapping(['zlib1g-dev', 'git-lfs']);
 * // On Fedora, returns: 'sudo dnf install -y zlib-devel git-lfs'
 * ```
 */
export function getInstallCommandWithMapping(
  genericPackages: string[],
  packageManager?: PackageManager,
  useSudo: boolean = true,
): string {
  const pm = packageManager || detectPackageManager();
  const mappedPackages = getPackageNames(genericPackages, pm);
  return getInstallCommand(mappedPackages, pm, useSudo);
}

/**
 * Checks if a package is available for the given package manager.
 *
 * @param genericName - The generic/Debian package name
 * @param packageManager - The package manager to check
 * @returns true if the package has a mapping for the package manager
 *
 * @example
 * ```typescript
 * if (isPackageAvailable('libtinfo5', 'dnf')) {
 *   // Install the package
 * }
 * ```
 */
export function isPackageAvailable(genericName: string, packageManager: PackageManager): boolean {
  const mapping = PACKAGE_MAPPINGS[genericName];
  if (!mapping) {
    return false;
  }
  return mapping[packageManager] !== undefined;
}

/**
 * Gets a human-readable name for the package manager.
 *
 * @param packageManager - The package manager
 * @returns Human-readable name
 */
export function getPackageManagerName(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'apt':
      return 'APT (Debian/Ubuntu)';
    case 'dnf':
      return 'DNF (Fedora/RHEL 8+)';
    case 'yum':
      return 'YUM (CentOS/RHEL 7)';
    case 'pacman':
      return 'Pacman (Arch Linux)';
    case 'zypper':
      return 'Zypper (openSUSE)';
    default:
      return 'Unknown';
  }
}
