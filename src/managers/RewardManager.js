const ms = require('../structures/ms')

const EconomyError = require('../classes/EconomyError')

const BalanceManager = require('./BalanceManager')
const DatabaseManager = require('./DatabaseManager')

const errors = require('../structures/Errors')
const UtilsManager = require('./UtilsManager')

const parse = ms => ({
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000 % 24),
    minutes: Math.floor(ms / 60000 % 60),
    seconds: Math.floor(ms / 1000 % 60),
    milliseconds: Math.floor(ms % 1000)
})

/**
* Reward manager methods class.
*/
class RewardManager {

    /**
      * Economy constructor options object. There's only needed options object properties for this manager to work properly.
      * @param {Object} options Constructor options object.
      * @param {String} options.storagePath Full path to a JSON file. Default: './storage.json'.
      * @param {Number} options.dailyCooldown Cooldown for Daily Command (in ms). Default: 24 Hours (60000 * 60 * 24) ms
      * @param {Number} options.workCooldown Cooldown for Work Command (in ms). Default: 1 Hour (60000 * 60) ms
      * @param {Number} options.dailyAmount Amount of money for Daily Command. Default: 100.
      * @param {Number} options.weeklyCooldown Cooldown for Weekly Command (in ms). Default: 7 Days (60000 * 60 * 24 * 7) ms
      * @param {Number} options.weeklyAmount Amount of money for Weekly Command. Default: 1000.
      * @param {Number | Array} options.workAmount Amount of money for Work Command. Default: [10, 50].
     */
    constructor(options) {

        /**
         * Utils manager methods object.
         * @type {UtilsManager}
         * @private
         */
        this.utils = new UtilsManager(options)

        /**
         * Economy constructor options object.
         * @private
         * @type {?EconomyOptions}
         */
        this.options = options

        /**
         * Database manager methods object.
         * @type {DatabaseManager}
         * @private
         */
        this.database = new DatabaseManager(options)

        /**
         * Balance manager methods object.
         * @type {DatabaseManager}
         * @private
         */
        this.balance = new BalanceManager(options)
    }

    /**
     * Adds a daily reward on user's balance.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {String} reason The reason why the money was added. Default: 'claimed the daily reward'.
     * @returns {RewardData} Daily reward object.
    */
    daily(memberID, guildID, reason = 'claimed the daily reward') {
        if (typeof memberID !== 'string') throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        if (typeof guildID !== 'string') throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)

        const cooldown = this.options.dailyCooldown
        const reward = this.options.dailyAmount

        const userCooldown = this.database.fetch(`${guildID}.${memberID}.dailyCooldown`)
        const cooldownEnd = cooldown - (Date.now() - userCooldown)

        if (userCooldown !== null && cooldownEnd > 0) return {
            status: false,
            value: parse(cooldownEnd),
            pretty: ms(cooldownEnd),
            reward
        }

        this.balance.add(reward, memberID, guildID, reason)
        this.database.set(`${guildID}.${memberID}.dailyCooldown`, Date.now())

        return {
            status: true,
            value: reward,
            pretty: reward,
            reward
        }
    }

    /**
     * Adds a work reward on user's balance.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {String} reason The reason why the money was added. Default: 'claimed the work reward'.
     * @returns {RewardData} Work reward object.
     */
    work(memberID, guildID, reason = 'claimed the work reward') {
        if (typeof memberID !== 'string') throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        if (typeof guildID !== 'string') throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)

                const cooldown = this.options.workCooldown
        const workReward = this.options.workAmount
        let reward

        if (Array.isArray(workReward)) {
            const min = workReward[0]
            const max = workReward[1]

            reward = Math.floor(Math.random() * (Number(min) - Number(max)) + Number(max))
            console.log(reward)
        }

        //if (Array.isArray(workReward) && workReward.length == 1) reward = workReward[0]
        //else reward = workReward
        //Fixed error here

        const userCooldown = this.database.fetch(`${guildID}.${memberID}.workCooldown`)
        const cooldownEnd = cooldown - (Date.now() - userCooldown)

        if (userCooldown !== null && cooldownEnd > 0) return {
            status: false,
            value: parse(cooldownEnd),
            pretty: ms(cooldownEnd),
            reward
        }
        //Added converting an object to integer to fix an error
        this.balance.add(parseInt(reward.toString()), memberID, guildID, reason)
        this.database.set(`${guildID}.${memberID}.workCooldown`, Date.now())

        return {
            status: true,
            value: reward,
            pretty: reward,
            reward
        }
    }

    /**
     * Adds a weekly reward on user's balance.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {String} reason The reason why the money was added. Default: 'claimed the weekly reward'.
     * @returns {RewardData} Weekly reward object.
     */
    weekly(memberID, guildID, reason = 'claimed the weekly reward') {
        if (typeof memberID !== 'string') throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        if (typeof guildID !== 'string') throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)

        const cooldown = this.options.weeklyCooldown
        const reward = this.options.weeklyAmount

        const userCooldown = this.database.fetch(`${guildID}.${memberID}.weeklyCooldown`)
        const cooldownEnd = cooldown - (Date.now() - userCooldown)

        if (userCooldown !== null && cooldownEnd > 0) return {
            status: false,
            value: parse(cooldownEnd),
            pretty: ms(cooldownEnd),
            reward
        }

        this.balance.add(reward, memberID, guildID, reason)
        this.database.set(`${guildID}.${memberID}.weeklyCooldown`, Date.now())

        return {
            status: true,
            value: reward,
            pretty: reward,
            reward
        }
    }
}

/**
 * @typedef {Object} RewardData
 * @property {Boolean} status The status of operation.
 * @property {CooldownData} value Reward or cooldown time object.
 * @property {String | Number} pretty Reward or formatted cooldown time object.
 * @property {Number | Array<Number>} reward Amount of money for the reward from constructor options.
 */

/**
 * @typedef {Object} CooldownData
 * @property {Number} days Amount of days until the cooldown ends.
 * @property {Number} hours Amount of hours until the cooldown ends.
 * @property {Number} minutes Amount of minutes until the cooldown ends.
 * @property {Number} seconds Amount of seconds until the cooldown ends.
 * @property {Number} milliseconds Amount of milliseconds until the cooldown ends.
 */

/**
 * Reward manager class.
 * @type {RewardManager}
 */
module.exports = RewardManager
