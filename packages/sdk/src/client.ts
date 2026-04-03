import type { CondorPayCoConfig } from "@condorpay/co";
import { CondorPayCo } from "@condorpay/co";

export type CondorPayConfig = { country: "co" } & CondorPayCoConfig;

export class CondorPay {
	readonly co: CondorPayCo;

	constructor(config: CondorPayConfig) {
		const { country: _country, ...providerConfig } = config;
		this.co = new CondorPayCo(providerConfig);
	}
}
