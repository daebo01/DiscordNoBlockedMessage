import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { React } from "enmity/metro/common";
import { create } from "enmity/patcher";
import manifest, { name as plugin_name } from "../manifest.json";
import { getByProps, getModule } from "enmity/modules";
import { get } from "enmity/api/settings";
import Settings from "./components/Settings";

const Patcher = create("NoBlockedMessage");

const RelationshipStore = getByProps("isBlocked", "isIgnored", "getFriendIDs")!;
const MessageStore = getStoreHandlers("MessageStore");

const NoBlockedMessage: Plugin = {
	...manifest,
	onStart() {
		Patcher.before(MessageStore, "LOAD_MESSAGES_SUCCESS", (self, args, res) => {
			args[0].messages = args[0].messages.filter((message) => {
				return (
					!RelationshipStore.isBlocked(message?.author?.id) &&
					!RelationshipStore.isIgnored(message?.author?.id) &&
					!(
						message.referenced_message &&
						get(plugin_name, "replies", true) &&
						RelationshipStore.isBlocked(message.referenced_message.author?.id)
					)
				);
			});
		});
		for (const event of ["MESSAGE_CREATE", "MESSAGE_UPDATE"]) {
			Patcher.before(MessageStore, event, (self, args, res) => {
				let message = args[0].message;
				if (
					RelationshipStore.isBlocked(message?.author?.id) ||
					RelationshipStore.isIgnored(message?.author?.id) ||
					(message.referenced_message &&
						get(plugin_name, "replies", true) &&
						RelationshipStore.isBlocked(message.referenced_message.author?.id))
				) {
					args[0].message = {};
				}
			});
		}
	},
	onStop() {
		Patcher.unpatchAll();
	},
	getSettingsPanel({ settings }) {
		return <Settings settings={settings} />;
	},
};

const getStores = getModule((n) => {
		var t, g, m;
		return (m =
			(g = (t = n._dispatcher) == null ? void 0 : t._actionHandlers) == null
				? void 0
				: g._dependencyGraph) == null
			? void 0
			: m.nodes;
	}),
	C = getStores._dispatcher._actionHandlers._dependencyGraph.nodes;

function getStoreHandlers(n) {
	const t = Object.keys(C).filter((g) => C[g].name === n);
	if (t.length) return C[t[0]].actionHandler;
}

registerPlugin(NoBlockedMessage);
