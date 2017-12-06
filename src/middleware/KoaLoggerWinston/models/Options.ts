import * as winston from 'winston';

export class Options {
	// Default log level
	public level: string;
	// The winston logger instance
	public winstonInstance?: winston.LoggerInstance;
	// Default winston transport to use if no logger instance is provided
	public transports?: winston.TransportInstance[];
	// Default request fields to be logged
	public reqKeys: string[];
	// Additional request fields to be logged
	public reqSelect: string[];
	// Request field will be removed from the log
	public reqUnselect: string[];
	// Default response fields to be logged
	public resKeys: string[];
	// Additional response fields to be logged
	public resSelect: string[];
	// Response field will be removed from the log
	public resUnselect: string[];
	public colorize: boolean;
}
