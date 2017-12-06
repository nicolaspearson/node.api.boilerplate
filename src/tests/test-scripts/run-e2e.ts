import { exec } from 'shelljs';

// Allow console output in test classes
/* tslint:disable no-console */
const executeE2ETests = () => {
	console.log('Executing end to end tests...');
	exec('mocha -r ts-node/register ./src/tests/e2e/**/*.spec.ts');
};

executeE2ETests();
