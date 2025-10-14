// module.exports = function(RED) {
//     function TriggerNode(config) {
//         RED.nodes.createNode(this,config);
//         var node = this;
//         node.on('input', function(msg) {
//             node.send(msg);
//         });
//     }
//     RED.nodes.registerType("chatbox-trigger-node",TriggerNode);
// }

module.exports = function (RED) {
    function ChatboxTriggerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // name falls back to id at runtime if missing
        node.name = (config.name && config.name.trim() !== "") ? config.name.trim() : this.id;

        const isValid = /^[A-Za-z0-9_-]{1,50}$/.test(node.name);
        node.status(
            isValid
                ? { fill: "green", shape: "dot", text: `name: ${node.name}` }
                : { fill: "red", shape: "ring", text: "invalid name" }
        );
        if (!isValid)
            node.warn("Invalid name: only letters, numbers, underscores, or hyphens allowed (no spaces).");

        node.on('input', function (msg, send, done) {
            send(msg);
            if (done) done();
        });
    }

    RED.nodes.registerType("chatbox-trigger-node", ChatboxTriggerNode);
};
