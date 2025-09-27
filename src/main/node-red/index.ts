import helper from "node-red-node-test-helper";
import path from "path";
import fs from 'fs/promises';
import { LocalSettings } from "@node-red/runtime";
import { isEmpty } from "lodash";
export interface NodeRedInterface {
    invokeNodeRed?: (name?: string, callback?: any) => Promise<any>;
}
export type FlowNode = {
    id: string;
    type: string;
    name?: string;
    wires?: string[][];
    [k: string]: any;
};
const getSettings = require("../../node-red/config").getSettings;
console.log("PRECHECK: ", getSettings, require('node-red'))
export class NodeRedImplementation implements NodeRedInterface {
    private helper = helper;
    private initialised = false;
    private nodeHashMap: Map<string, FlowNode> = new Map<string, FlowNode>();
    public async invokeNodeRed(name?: string, callback?: any): Promise<any> {
        try {
            console.log("Invoke node red");
            if (!this.initialised) {
                await this.init();
            }
            if (typeof callback === 'function') {
                callback(`Invoked Node-RED with name: ${name}`);
            }
            const nodeDef = await this.getNodeByName(name);
            if (!nodeDef) {
                console.log("NODE DEF IS NULL", name);
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
            const firstNode = this.helper.getNode(nodeId);
            console.log("first node", firstNode);
            console.log("last node", lastNodes);
            if (!firstNode) {
                return null;
            }
            const finalMessages = await (async () => {
                const result = Promise.all(lastNodes.map((node) => {
                    const realNode = this.helper.getNode(node.id);
                    if (!realNode) {
                        return Promise.resolve({}); // do better
                    }
                    return new Promise((resolve, reject) => {
                        //TODO: HANDLE TIMEOUT
                        realNode.on("input", (msg) => {
                            resolve(msg);
                        })
                    })
                }))
                firstNode.receive();
                return result;
            })()
            console.log("finalMessages", finalMessages);
            return {
                result: `Invoked Node-RED with name: ${name}`,
                payload: finalMessages
            }
        }
        catch (e) {
            console.log("Failed To Trigger NodeRed",e);
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
        const localSettings: LocalSettings = {
            uiPort: settings.uiPort,
            uiHost: settings.uiHost,
            flowFile: settings.flowFile
        }
        helper.init(require.resolve("node-red"), localSettings);
        this.initialised = true;
        const flowNodes = await this.readFlowFile(settings);
        console.log("FLOW NODES", flowNodes);
        this.nodeHashMap = new Map<string, FlowNode>();
        if (!flowNodes) {
            return;
        }
        for (const flowNode of flowNodes) {
            this.nodeHashMap.set(flowNode.id, { ...flowNode });
        }
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