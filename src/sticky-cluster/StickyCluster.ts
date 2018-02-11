import * as cluster from 'cluster';
import * as http from 'http';
import { Inject, Service } from 'typedi';

import AppLogger from '../app/AppLogger';
import { IStickyClusterOptions } from './IStickyClusterOptions';
import { Master } from './Master';
import { Worker } from './Worker';

@Service()
export class StickyCluster {
	@Inject() private appLogger: AppLogger;

	@Inject() private master: Master;

	@Inject() private worker: Worker;

	public startCluster(
		masterStartFunction: any,
		workerStartFunction: any,
		clusterOptions: IStickyClusterOptions
	) {
		const options: IStickyClusterOptions = {
			prefix: clusterOptions.prefix || 'sticky-cluster:',
			concurrency:
				clusterOptions.concurrency || require('os').cpus().length,
			port: clusterOptions.port || 3000,
			hardShutdownDelay: clusterOptions.hardShutdownDelay || 60 * 1000
		};
		this.appLogger.winston.debug(
			`Sticky Cluster: Starting with options: ${JSON.stringify(options)}`
		);
		if (cluster.isMaster) {
			masterStartFunction(() => {
				this.master.start(options);
			});
		} else if (cluster.isWorker) {
			workerStartFunction((server: http.Server) => {
				this.worker.serveWorkers(server, options);
			});
		}
	}
}
