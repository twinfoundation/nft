// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StringHelper, Converter } from '@twin.org/core';
import { Sha3 } from '@twin.org/crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsPath = path.join(__dirname, '../src/contracts');
const outputPath = path.join(__dirname, '../src/contracts/compiledModules');

if (!fs.existsSync(outputPath)) {
	fs.mkdirSync(outputPath, { recursive: true });
}

const compiledModulesJsonPath = path.join(outputPath, 'compiled-modules.json');
let outputJson = {};

const contractDirs = fs.readdirSync(contractsPath).filter(dir => {
	const stat = fs.statSync(path.join(contractsPath, dir));
	return stat.isDirectory() && dir !== 'compiledModules'; // Exclude compiledModules if present
});

// If the JSON already exists, read and parse it
if (fs.existsSync(compiledModulesJsonPath)) {
	const existingJson = fs.readFileSync(compiledModulesJsonPath, 'utf8');
	outputJson = JSON.parse(existingJson);
}

for (const contractDir of contractDirs) {
	const contractName = StringHelper.kebabCase(contractDir);
	const buildFolderName = StringHelper.snakeCase(contractDir);

	const bytecodeModulesPath = path.join(
		contractsPath,
		contractDir,
		'build',
		buildFolderName,
		'bytecode_modules'
	);

	if (fs.existsSync(bytecodeModulesPath)) {
		const moduleFiles = fs.readdirSync(bytecodeModulesPath).filter(file => file.endsWith('.mv'));

		const modulesBase64 = [];
		const modulesBytesForHash = [];

		for (const file of moduleFiles) {
			const modulePath = path.join(bytecodeModulesPath, file);
			const moduleBytes = fs.readFileSync(modulePath);

			modulesBytesForHash.push(moduleBytes);

			const base64Module = Converter.bytesToBase64(moduleBytes);
			modulesBase64.push(base64Module);
		}

		const concatenatedModuleBytes = Buffer.concat(modulesBytesForHash);

		const computedPackageIdBytes = Sha3.sum256(concatenatedModuleBytes);
		const computedPackageId = `0x${Converter.bytesToHex(computedPackageIdBytes)}`;

		outputJson[contractName] = {
			packageId: computedPackageId,
			package: modulesBase64.length === 1 ? modulesBase64[0] : modulesBase64
		};

		// eslint-disable-next-line no-console
		console.log(`Processed contract: ${contractName}`);
	} else {
		// eslint-disable-next-line no-console
		console.warn(`No bytecode_modules found for contract ${contractDir}`);
	}
}

fs.writeFileSync(compiledModulesJsonPath, `${JSON.stringify(outputJson, undefined, '\t')}\n`);

// eslint-disable-next-line no-console
console.log('Compiled modules have been written to compiled-modules.json');
