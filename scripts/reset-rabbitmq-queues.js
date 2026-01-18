/**
 * Script to reset ALL RabbitMQ queues and exchanges
 * Run this when switching between local/remote RabbitMQ or when queues have stale messages
 *
 * Usage: node scripts/reset-rabbitmq-queues.js [local|remote]
 */

const amqp = require("amqplib");
const http = require("http");

// RabbitMQ Management API config
const MANAGEMENT_PORTS = {
	local: 15672,
	remote: 46272, // Adjust if different
};

const CREDENTIALS = {
	username: "supper",
	password: "supper",
};

// Default exchanges that should NOT be deleted
const PROTECTED_EXCHANGES = [
	"", // Default exchange
	"amq.direct",
	"amq.fanout",
	"amq.headers",
	"amq.match",
	"amq.topic",
	"amq.rabbitmq.trace",
];

/**
 * Fetch data from RabbitMQ Management API
 */
async function fetchFromManagementAPI(host, port, endpoint) {
	return new Promise((resolve, reject) => {
		const auth = Buffer.from(
			`${CREDENTIALS.username}:${CREDENTIALS.password}`,
		).toString("base64");
		const options = {
			hostname: host,
			port: port,
			path: `/api/${endpoint}`,
			method: "GET",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/json",
			},
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					reject(new Error(`Failed to parse response: ${data}`));
				}
			});
		});

		req.on("error", reject);
		req.setTimeout(5000, () => {
			req.destroy();
			reject(new Error("Request timeout"));
		});
		req.end();
	});
}

async function resetRabbitMQ(connectionUrl, env) {
	console.log(`\n🔄 Connecting to RabbitMQ: ${connectionUrl}\n`);

	let connection;
	try {
		connection = await amqp.connect(connectionUrl);
		const channel = await connection.createChannel();

		// Try to get queue/exchange list from Management API
		const host = env === "local" ? "localhost" : "103.249.117.202";
		const mgmtPort = MANAGEMENT_PORTS[env];

		let queues = [];
		let exchanges = [];

		try {
			console.log(
				`📡 Fetching queue list from Management API (${host}:${mgmtPort})...`,
			);
			queues = await fetchFromManagementAPI(host, mgmtPort, "queues");
			exchanges = await fetchFromManagementAPI(host, mgmtPort, "exchanges");
			console.log(
				`  Found ${queues.length} queues and ${exchanges.length} exchanges\n`,
			);
		} catch (apiError) {
			console.log(`  ⚠️  Management API not accessible: ${apiError.message}`);
			console.log("  Using fallback queue list...\n");

			// Fallback to known queues (both with and without local_ prefix)
			queues = [
				// With local_ prefix
				{ name: "local_api_gateway_queue" },
				{ name: "local_api_gateway_dlq" },
				{ name: "local_waiter_queue" },
				{ name: "local_waiter_dlq" },
				{ name: "local_kitchen_queue" },
				{ name: "local_kitchen_dlq" },
				{ name: "local_notification_queue" },
				{ name: "local_notification_dlq" },
				{ name: "local_order_queue" },
				{ name: "local_order_dlq" },
				// Without local_ prefix (production)
				{ name: "api_gateway_queue" },
				{ name: "api_gateway_dlq" },
				{ name: "waiter_queue" },
				{ name: "waiter_dlq" },
				{ name: "kitchen_queue" },
				{ name: "kitchen_dlq" },
				{ name: "notification_queue" },
				{ name: "notification_dlq" },
				{ name: "order_queue" },
				{ name: "order_dlq" },
				// Prod prefix
				{ name: "prod_api_gateway_queue" },
				{ name: "prod_api_gateway_dlq" },
				{ name: "prod_waiter_queue" },
				{ name: "prod_waiter_dlq" },
				{ name: "prod_kitchen_queue" },
				{ name: "prod_kitchen_dlq" },
				{ name: "prod_notification_queue" },
				{ name: "prod_notification_dlq" },
				{ name: "prod_order_queue" },
				{ name: "prod_order_dlq" },
			];

			exchanges = [
				// Order events exchanges
				{ name: "order_events_exchange" },
				{ name: "local_order_events_exchange" },
				// DLX exchanges with local_ prefix
				{ name: "local_api_gateway_dlx_exchange" },
				{ name: "local_waiter_dlx_exchange" },
				{ name: "local_kitchen_dlx_exchange" },
				{ name: "local_notification_dlx_exchange" },
				{ name: "local_order_dlx_exchange" },
				// DLX exchanges without prefix
				{ name: "api_gateway_dlx_exchange" },
				{ name: "waiter_dlx_exchange" },
				{ name: "kitchen_dlx_exchange" },
				{ name: "notification_dlx_exchange" },
				{ name: "order_dlx_exchange" },
				// DLX exchanges with prod_ prefix
				{ name: "prod_api_gateway_dlx_exchange" },
				{ name: "prod_waiter_dlx_exchange" },
				{ name: "prod_kitchen_dlx_exchange" },
				{ name: "prod_notification_dlx_exchange" },
				{ name: "prod_order_dlx_exchange" },
			];
		}

		// Step 1: Delete all queues
		console.log("📦 Deleting ALL queues...");
		for (const queue of queues) {
			const queueName = queue.name;
			try {
				const result = await channel.deleteQueue(queueName);
				console.log(
					`  ✅ Deleted queue: ${queueName} (${result.messageCount} messages purged)`,
				);
			} catch (err) {
				console.log(`  ⚠️  Could not delete: ${queueName} - ${err.message}`);
			}
		}

		// Step 2: Delete all exchanges (except protected ones)
		console.log("\n📡 Deleting ALL custom exchanges...");
		for (const exchange of exchanges) {
			const exchangeName = exchange.name;

			// Skip protected exchanges
			if (PROTECTED_EXCHANGES.includes(exchangeName)) {
				continue;
			}

			try {
				await channel.deleteExchange(exchangeName);
				console.log(`  ✅ Deleted exchange: ${exchangeName}`);
			} catch (err) {
				console.log(`  ⚠️  Could not delete: ${exchangeName} - ${err.message}`);
			}
		}

		// Step 3: Recreate fanout exchanges
		console.log("\n🔧 Recreating order events exchanges...");
		await channel.assertExchange("order_events_exchange", "fanout", {
			durable: true,
		});
		console.log("  ✅ Created exchange: order_events_exchange (fanout)");
		
		await channel.assertExchange("local_order_events_exchange", "fanout", {
			durable: true,
		});
		console.log("  ✅ Created exchange: local_order_events_exchange (fanout)");

		await channel.close();
		await connection.close();

		console.log("\n✨ RabbitMQ reset complete!");
		console.log(
			"👉 Now restart your services to recreate queues with proper bindings.\n",
		);
	} catch (error) {
		console.error("❌ Error:", error.message);
		if (connection) {
			try {
				await connection.close();
			} catch (e) {}
		}
		process.exit(1);
	}
}

// Main
const env = process.argv[2] || "local";
const urls = {
	local: "amqp://supper:supper@localhost:5672",
	remote: "amqp://supper:supper@103.249.117.202:46270",
};

if (!urls[env]) {
	console.log("Usage: node scripts/reset-rabbitmq-queues.js [local|remote]");
	process.exit(1);
}

resetRabbitMQ(urls[env], env);
