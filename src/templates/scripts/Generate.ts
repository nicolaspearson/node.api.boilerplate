import * as inquirer from 'inquirer';
import * as path from 'path';
import * as utils from './Utils';

// tslint:disable no-console

const questions: inquirer.Questions = [
	{
		name: 'module-choice',
		type: 'list',
		message: 'What module template would you like to generate?',
		choices: ['All', 'Controller', 'Model', 'Service', 'Repository']
	},
	{
		name: 'module-name',
		type: 'input',
		message: 'Module name:',
		validate: (input: any) => {
			if (/^([A-Za-z\-\_\d])+$/.test(input)) {
				return true;
			} else {
				return 'Module name may only include letters, numbers, and underscores.';
			}
		}
	}
];

inquirer.prompt(questions).then(answers => {
	processPrompt(answers);
});

async function processPrompt(answers: inquirer.Answers) {
	const moduleChoice = answers['module-choice'];
	const moduleName = answers['module-name'];
	switch (moduleChoice) {
		case 'All':
			console.log('Start generating: All');
			await createModel(moduleName);
			await createRepository(moduleName);
			await createService(moduleName);
			await createController(moduleName);
			break;

		case 'Model':
			await createModel(moduleName);
			break;

		case 'Repository':
			await createRepository(moduleName);
			break;

		case 'Service':
			await createService(moduleName);
			break;

		case 'Controller':
			await createController(moduleName);
			break;

		default:
			break;
	}
	const titleCaseModuleName = `${utils.firstToUpperCase(moduleName)}`;
	console.log(
		`\nRemember to create the database table for the new entity: ${titleCaseModuleName}\n`
	);
}

async function createModel(moduleName: string): Promise<void> {
	// Define the source template file
	const sourceFile = path.resolve('./src/templates/models/Template.ts');
	// Define the target directory
	const targetDir = path.resolve('./src/models/');
	// Define the target filename
	const targetFilename = `${utils.firstToUpperCase(moduleName)}.ts`;
	// Create the file
	await createModuleFile(sourceFile, targetDir, targetFilename, moduleName);
	console.log('Model Created');
	return;
}

async function createRepository(moduleName: string): Promise<void> {
	// Define the source template file
	const sourceFile = path.resolve(
		'./src/templates/repositories/TemplateRepository.ts'
	);
	// Define the target directory
	const targetDir = path.resolve('./src/repositories/');
	// Define the target filename
	const targetFilename = `${utils.firstToUpperCase(moduleName)}Repository.ts`;
	// Create the file
	await createModuleFile(sourceFile, targetDir, targetFilename, moduleName);
	console.log('Repository Created');
	return;
}

async function createService(moduleName: string): Promise<void> {
	// Define the source template file
	const sourceFile = path.resolve(
		'./src/templates/services/TemplateService.ts'
	);
	// Define the target directory
	const targetDir = path.resolve('./src/services/');
	// Define the target filename
	const targetFilename = `${utils.firstToUpperCase(moduleName)}Service.ts`;
	// Create the file
	await createModuleFile(sourceFile, targetDir, targetFilename, moduleName);
	console.log('Service Created');
	return;
}

async function createController(moduleName: string): Promise<void> {
	// Define the source template file
	const sourceFile = path.resolve(
		'./src/templates/controllers/TemplateController.ts'
	);
	// Define the target directory
	const targetDir = path.resolve('./src/controllers/');
	// Define the target filename
	const targetFilename = `${utils.firstToUpperCase(moduleName)}Controller.ts`;
	// Create the file
	await createModuleFile(sourceFile, targetDir, targetFilename, moduleName);
	console.log('Controller Created');
	return;
}

async function createModuleFile(
	sourceFile: string,
	targetDir: string,
	targetFilename: string,
	moduleName: string
): Promise<void> {
	// Create the file
	const destFile = await utils.createFile(
		sourceFile,
		targetDir,
		targetFilename
	);

	// Replace "Template" occurrences with the module name
	if (destFile) {
		await utils.replaceInFile(destFile, moduleName);
	}
	return;
}
