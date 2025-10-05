// import helper from "node-red-node-test-helper";
import path, { resolve } from "path";
import fs from 'fs/promises';
import { isEmpty, result, cloneDeep } from "lodash";
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

export type NodeRedNodeDef = {
    id?: string;
    type?: string;
    z?: string;
    name?: string;
    props?: {
        p?: string;
        vt?: string;
    }[];
    repeat?: string;
    crontab?: string;
    once?: boolean;
    onceDelay?: number;
    topic?: string;
    payload?: string;
    payloadType?: string;
    x?: number;
    y?: number;
    wires?: string[][];
};
const { getNodeRed } = require("../../node-red/node-red");
export class NodeRedImplementation implements NodeRedInterface {
    private nodes = require("@node-red/runtime/lib/nodes");
    private _RED_ = getNodeRed();
    public async invokeNodeRed(name?: string, payload?: any): Promise<any> {
        try {
            log.warn("Invoke node red");
            // if (typeof callback === 'function') {
            //     callback(`Invoked Node-RED with name: ${name}`);
            // }
            const nodeDef = await this.getNodeByName(name);
            if (!nodeDef) {
                log.warn("NODE DEF IS NULL", name);
                return null;
            }
            const nodeId = nodeDef.id || "";
            //TODO: ADD TYPES DEFINITION HERE
            const nodeImp = this._RED_.nodes.getNode(nodeId);
            const finalMessage = await new Promise<any>((resolve, reject) => {
                const msg = {
                    callbackSuccess: (payload: any) => resolve(payload),
                    callbackError: (payload: any) => reject(payload),
                    chatboxPayload: cloneDeep(payload)
                };

                try {
                    nodeImp.receive(msg);
                } catch (err) {
                    reject(err);
                }
            });
            // log.warn(nodeImp, nodeImp.receive);

            // const finalResult = new Promise((resolve, reject) => {

            // })
            return {
                result: `Invoked Node-RED with name ${name}`,
                payload: finalMessage
            }
        }
        catch (e) {
            log.warn("Failed To Trigger NodeRed", e);
            return {};
        }
    }

    private async getNodeByName(name: string | undefined | null): Promise<NodeRedNodeDef | null> {
        const nodes = this._RED_.nodes;
        const flow = nodes.getFlows().flows;
        if (!flow) {
            return null;
        }
        if (!name) {
            return flow.filter((item: any) => item.type !== 'tab')[0] || null;
        }
        // search by node.name
        const def = flow.find((n: any) => n.name === name);
        return def || null;
    }

}