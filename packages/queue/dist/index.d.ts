import * as PgBoss from "pg-boss";
export { PgBoss };
import { Config } from "@fullstack-one/config";
export declare class QueueFactory {
    private queue;
    private logger;
    private generalPool;
    constructor(bootLoader: any, loggerFactory: any, generalPool: any, config: Config);
    private start;
    getQueue(): Promise<PgBoss>;
}
