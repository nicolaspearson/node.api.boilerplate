import * as fs from 'fs-extra';
import * as path from 'path';
import * as pluralize from 'pluralize';
import * as replace from 'replace-in-file';

export async function createFile(
	srcFile: fs.PathLike,
	destDir: string,
	destFilename: string
): Promise<fs.PathLike | undefined> {
	const destFile = path.join(destDir, destFilename);
	try {
		fs.accessSync(destDir);
	} catch (error) {
		fs.mkdirSync(destDir);
	}

	try {
		fs.accessSync(destDir);
		await copyFile(srcFile, destFile);
		return destFile;
	} catch (error) {
		return;
	}
}

async function copyFile(
	srcFile: fs.PathLike,
	destFile: fs.PathLike
): Promise<void> {
	fs.copySync(srcFile.toString(), destFile.toString());
	return;
}

export async function replaceInFile(
	destFile: fs.PathLike,
	moduleName: string
): Promise<void> {
	pluralize.addSingularRule(/singles$/i, 'singular');
	const titleCaseSingular: string = firstToUpperCase(moduleName);
	const titleCasePlural: string = pluralize(titleCaseSingular);
	const lowerCaseSingular: string = firstToLowerCase(moduleName);
	const lowerCasePlural: string = pluralize(lowerCaseSingular);

	// Replace Title Case Plural
	let options = {
		files: destFile,
		from: new RegExp('Templates', 'g'),
		to: titleCasePlural
	};
	replace.sync(options);

	// Replace Lower Case Plural
	options = {
		files: destFile,
		from: new RegExp('templates', 'g'),
		to: lowerCasePlural
	};
	replace.sync(options);

	// Replace Title Case Singular
	options = {
		files: destFile,
		from: new RegExp('Template', 'g'),
		to: titleCaseSingular
	};
	replace.sync(options);

	// Replace Lower Case Singular
	options = {
		files: destFile,
		from: new RegExp('template', 'g'),
		to: lowerCaseSingular
	};
	replace.sync(options);

	// Replace the Exceptions references
	let newOptions = {
		files: destFile,
		from: '../../exceptions',
		to: '../exceptions'
	};
	replace.sync(newOptions);

	// Replace the Base Repository references
	newOptions = {
		files: destFile,
		from: '../../repositories/BaseRepository',
		to: './BaseRepository'
	};
	replace.sync(newOptions);

	// Replace the Base Service references
	newOptions = {
		files: destFile,
		from: '../../services/BaseService',
		to: './BaseService'
	};
	replace.sync(newOptions);

	// Replace the ISearchQueryBuilderOptions references
	newOptions = {
		files: destFile,
		from: '../../models/options/ISearchQueryBuilderOptions',
		to: '../models/options/ISearchQueryBuilderOptions'
	};
	replace.sync(newOptions);

	// Replace the Model references
	newOptions = {
		files: destFile,
		from: '../../models/',
		to: '../models/'
	};
	replace.sync(newOptions);

	// Replace the Repository references
	newOptions = {
		files: destFile,
		from: '../../repositories/',
		to: '../repositories/'
	};
	replace.sync(newOptions);

	// Replace the Service references
	newOptions = {
		files: destFile,
		from: '../../services/',
		to: '../services/'
	};
	replace.sync(newOptions);

	return;
}

export function firstToUpperCase(str: string) {
	return str.substr(0, 1).toUpperCase() + str.substr(1);
}

function firstToLowerCase(str: string) {
	return str.substr(0, 1).toLowerCase() + str.substr(1);
}
