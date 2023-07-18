let Util = require("./util");
let Usage = require('./usage');
const subscription = require('oci-osuborganizationsubscription');

class Subscription {

    #provider = "";
    #util = ""

    constructor(provider){
        this.#provider = provider;
        this.#util = new Util();
        return this;
    }

    /**
     * Obtem a lista de todos subscriptions
     */
    async listSubscriptions() {
        try {
            const client =  new subscription.OrganizationSubscriptionClient({authenticationDetailsProvider: this.#provider});

            const result = await client.listOrganizationSubscriptions({
                compartmentId: this.#provider.getTenantId(),
            });
            
            const { items } = result;

            const contracts = [];

            for (const contract of items) {
                const usage = new Usage(this.#provider)
                let currentSpent = await usage.listAccountOverviewFromTime(contract.timeStart, contract.timeEnd);
                contract.currentSpent = String(currentSpent);
                let currentDate = new Date();
                let currentMonthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                let fifthMonthAgoFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
                let lastFiveMonthsCost = await usage.listAccountOverviewFromTime(fifthMonthAgoFirstDay, currentMonthFirstDay);
                let remainingCredits = parseFloat(contract.totalValue) - parseFloat(currentSpent)
                let media = String(lastFiveMonthsCost / 5);
                contract.estimatedMonthsToCreditsToRunOut = (remainingCredits / parseFloat(media)).toFixed(1)
                contracts.push(contract);
            }

            return result.items;
        } catch (error) {
            if (error.statusCode && error.statusCode === 401) {
                return [{ serviceName: 'Pay as you go' }];
            }
        }
    }

}

module.exports = Subscription
