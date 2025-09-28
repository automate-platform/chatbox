// import helper from "node-red-node-test-helper";
import path from "path";
import fs from 'fs/promises';
import { isEmpty } from "lodash";
export interface NodeRedInterface {
    invokeNodeRed?: (name?: string, callback?: any) => Promise<any>;
}
import log from 'electron-log';
export type FlowNode = {
    id: string;
    type: string;
    name?: string;
    wires?: string[][];
    [k: string]: any;
};
const getSettings = require("../../node-red/config").getSettings;
log.warn("PRECHECK: ", getSettings, require('node-red'))
export class NodeRedImplementation implements NodeRedInterface {
    private nodes = require("@node-red/runtime/lib/nodes");
    private initialised = false;
    private nodeHashMap: Map<string, FlowNode> = new Map<string, FlowNode>();
    public async invokeNodeRed(name?: string, callback?: any): Promise<any> {
        try {
            log.warn("Invoke node red");
            if (!this.initialised) {
                await this.init();
            }
            if (typeof callback === 'function') {
                callback(`Invoked Node-RED with name: ${name}`);
            }
            const nodeDef = await this.getNodeByName(name);
            if (!nodeDef) {
                log.warn("NODE DEF IS NULL", name);
                return null;
            }
            const nodeId = nodeDef.id || "";
            const lastNodes: FlowNode[] = [];
            let stackIds = [nodeId];
            while (!isEmpty(stackIds)) {
                const currentStackId = stackIds.pop() || "";
                const node = this.nodeHashMap.get(currentStackId);
                if (!node) {
                    continue;
                }
                if (isEmpty(node.wires)) {
                    lastNodes.push(node);
                }
                const nodeWiredIds = node.wires?.flat();
                if (!nodeWiredIds) {
                    continue;
                }
                for (const nodeWiredId of nodeWiredIds) {
                    const tempNode = this.nodeHashMap.get(nodeWiredId);
                    stackIds.push(tempNode?.id || "");
                }
            }
            const firstNode = this.nodes.getNode(nodeId);
            log.warn("first node", firstNode);
            log.warn("last node", lastNodes);
            if (!firstNode) {
                return null;
            }
            const finalMessages = await (async () => {
                const result = Promise.all(lastNodes.map((node) => {
                    const realNode = this.nodes.getNode(node.id);
                    if (!realNode) {
                        return Promise.resolve({}); // do better
                    }
                    return new Promise((resolve, reject) => {
                        //TODO: HANDLE TIMEOUT
                        realNode.on("input", (msg:any) => {
                            resolve(msg);
                        })
                    })
                }))
                firstNode.receive();
                return result;
            })()
            log.warn("finalMessages", finalMessages);
            return {
                result: `Invoked Node-RED with name: ${name}`,
                payload: finalMessages
            }
        }
        catch (e) {
            log.warn("Failed To Trigger NodeRed",e);
            return {};
        }
    }

    private async getNodeByName(name: string | undefined | null) {
        if (!this.initialised) {
            this.init();
        }
        const settings = await getSettings();
        const flow = await this.readFlowFile(settings);
        if (!flow) {
            return null;
        }
        if (!name) {
            return flow.filter(item => item.type !== 'tab')[0] || null;
        }
        // search by node.name
        const def = flow.find((n: any) => n.name === name);
        return def || null;
    }
    private async init() {
        const settings = await getSettings();
        const flowNodes = await this.readFlowFile(settings);
        log.warn("FLOW NODES", flowNodes);
        this.nodeHashMap = new Map<string, FlowNode>();
        if (!flowNodes) {
            return;
        }
        for (const flowNode of flowNodes) {
            this.nodeHashMap.set(flowNode.id, { ...flowNode });
        }
        this.initialised = true;
    }
    private async readFlowFile(settings: any): Promise<FlowNode[] | null | undefined> {
        const flowPath = path.isAbsolute(settings.flowFile)
            ? settings.flowFile
            : path.join(settings.userDir || process.cwd(), settings.flowFile);

        const raw = await fs.readFile(flowPath, "utf-8");
        // TODO: CHECK FILE INIT
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as FlowNode[];
    }
}