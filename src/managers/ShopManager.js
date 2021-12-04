const Emitter = require('../classes/Emitter')
const EconomyError = require('../classes/EconomyError')

const FetchManager = require('./FetchManager')
const InventoryManager = require('./InventoryManager')
const DatabaseManager = require('./DatabaseManager')
const BalanceManager = require('./BalanceManager')

const errors = require('../structures/errors')

/**
 * Shop manager methods class.
 * @extends {Emitter}
 */
class ShopManager extends Emitter {

    /**
      * Economy constructor options object. 
      * There's only needed options object properties for this manager to work properly.
      * @param {Object} options Constructor options object.
      * @param {String} options.storagePath Full path to a JSON file. Default: './storage.json'.
      * @param {String} options.dateLocale The region (example: 'ru' or 'en') to format date and time. Default: 'en'.
      * @param {Boolean} options.subtractOnBuy
      * If true, when someone buys the item, their balance will subtract by item price.
      * @param {Boolean} options.deprecationWarnings 
      * If true, the deprecation warnings will be sent in the console.
     */
    constructor(options = {}) {
        super()

        /**
         * Economy constructor options object.
         * @type {?EconomyOptions}
         * @private
         */
        this.options = options

        /**
         * Inventory manager methods object.
         * @type {InventoryManager}
         * @private
         */
        this._inventory = new InventoryManager(options)

        /**
         * Inventory manager methods object.
         * @type {FetchManager}
         * @private
         */
        this.fetcher = new FetchManager(options)

        /**
         * Database manager methods object.
         * @type {DatabaseManager}
         * @private
         */
        this.database = new DatabaseManager(options)

        /**
         * Balance manager methods object.
         * @type {BalanceManager}
         * @private
         */
        this.balance = new BalanceManager(options)
    }

    /**
     * Creates an item in shop.
     * @param {String} guildID Guild ID.
     * @param {AddItemOptions} options object with item info.
     * @returns {ItemData} Item info.
     */
    addItem(guildID, options = {}) {
        const { itemName, price, message, description, maxAmount, role } = options
        const date = new Date().toLocaleString(this.options.dateLocale || 'en')
        const shop = this.fetcher.fetchShop(guildID)

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (typeof itemName !== 'string') {
            throw new EconomyError(errors.invalidTypes.addItemOptions.itemName + typeof itemName)
        }

        if (isNaN(price)) {
            throw new EconomyError(errors.invalidTypes.addItemOptions.price + typeof price)
        }

        if (message && typeof message !== 'string') {
            throw new EconomyError(errors.invalidTypes.addItemOptions.message + typeof message)
        }

        if (description && typeof description !== 'string') {
            throw new EconomyError(errors.invalidTypes.addItemOptions.description + typeof description)
        }

        if (maxAmount !== undefined && isNaN(maxAmount)) {
            throw new EconomyError(errors.invalidTypes.addItemOptions.maxAmount + typeof maxAmount)
        }

        if (role && typeof role !== 'string') {
            throw new EconomyError(errors.invalidTypes.addItemOptions.role + typeof role)
        }

        const itemInfo = {
            id: shop.length ? shop[shop.length - 1].id + 1 : 1,
            itemName,
            price,
            message: message || 'You have used this item!',
            description: description || 'Very mysterious item.',
            maxAmount: maxAmount == undefined ? null : Number(maxAmount),
            role: role || null,
            date
        }

        this.database.push(`${guildID}.shop`, itemInfo)

        return itemInfo
    }

    /**
     * Edits the item in the shop.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} guildID Guild ID
     * @param {'description' | 'price' | 'itemName' | 'message' | 'maxAmount' | 'role'} arg 
     * This argument means what thing in item you want to edit. 
     * Available arguments are 'description', 'price', 'name', 'message', 'amount', 'role'.
     * 
     * @returns {Boolean} If edited successfully: true, else: false.
     */
    editItem(itemID, guildID, arg, value) {
        const args = ['description', 'price', 'itemName', 'message', 'maxAmount', 'role']

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!args.includes(arg)) {
            throw new EconomyError(errors.invalidTypes.editItemArgs.arg + arg)
        }

        if (value == undefined) {
            throw new EconomyError(errors.invalidTypes.editItemArgs.arg + value)
        }

        const edit = (arg, value) => {

            /**
             * @type {ItemData[]}
             */
            const shop = this.list(guildID)
            const itemIndex = shop.findIndex(x => x.id == itemID || x.itemName == itemID)
            const item = shop[itemIndex]

            if (!item) return false

            this.database.set(`${guildID}.shop.${itemIndex}.${arg}`, value)
            this.emit('shopEditItem', {
                itemID,
                guildID,
                changed: arg,
                oldValue: item[arg],
                newValue: value
            })

            return true
        }

        switch (arg) {
            case args[0]:
                edit(args[0], value)
                break
            case args[1]:
                edit(args[1], value)
                break
            case args[2]:
                edit(args[2], value)
                break
            case args[3]:
                edit(args[3], value)
                break
            case args[4]:
                edit(args[4], value)
                break
            case args[5]:
                edit(args[5], value)
                break
            default: null
        }
    }

    /**
     * Removes an item from the shop.
     * @param {Number | String} itemID Item ID or name .
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If removed: true, else: false.
     */
    removeItem(itemID, guildID) {

        /**
        * @type {ItemData[]}
        */
        const shop = this.list(guildID)
        const itemIndex = shop.findIndex(x => x.id == itemID || x.itemName == itemID)
        const item = shop[itemIndex]

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        this.database.removeElement(`${guildID}.shop`, itemIndex)

        this.emit('shopRemoveItem', {
            id: item.id,
            itemName: item.itemName,
            price: item.price,
            message: item.message,
            description: item.description,
            maxAmount: item.maxAmount,
            role: item.role || null,
            date: item.date
        })

        return true
    }

    /**
     * Clears the shop.
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If cleared: true, else: false.
     */
    clear(guildID) {
        const shop = this.list(guildID)

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!shop && !shop?.length) {
            this.emit('shopClear', false)
            return false
        }

        this.database.remove(`${guildID}.shop`)
        this.emit('shopClear', true)

        return true
    }

    /**
     * Clears the user's inventory.
     * 
     * [!!!] This method is deprecated.
     * If you want to get all the bugfixes and
     * use the newest inventory features, please
     * switch to the usage of the new InventoryManager.
     * 
     * [!!!] No help will be provided for inventory
     * related methods in ShopManager.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If cleared: true, else: false.
     * @deprecated
     */
    clearInventory(memberID, guildID) {
        if (this.options.deprecationWarnings) {
            console.log(
                errors.deprecationWarning(
                    'ShopManager', 'clearInventory',
                    'InventoryManager', 'clear'
                )
            )
        }


        const inventory = this._inventory.fetch(memberID, guildID)

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!inventory) return false

        return this.database.remove(`${guildID}.${memberID}.inventory`)
    }

    /**
     * Clears the user's purchases history.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {Boolean} If cleared: true, else: false.
     */
    clearHistory(memberID, guildID) {
        const history = this.fetcher.fetchHistory(memberID, guildID)

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!history) return false

        return this.database.remove(`${guildID}.${memberID}.history`)
    }

    /**
     * Shows all items in the shop.
     * @param {String} guildID Guild ID.
     * @returns {ItemData[]} The shop array.
     */
    list(guildID) {
        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        const shop = this.fetcher.fetchShop(guildID)
        return shop
    }

    /**
     * Shows all items in the shop.
     * 
     * This method is an alias for the `ShopManager.list()` method.
     * @param {String} guildID Guild ID.
     * @returns {ItemData[]} The shop array.
     */
    fetch(guildID) {
        return this.list(guildID)
    }

    /**
     * Searches for the item in the shop.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} guildID Guild ID.
     * @returns {ItemData} If item not found: null; else: item info object.
     */
    searchItem(itemID, guildID) {

        /**
        * @type {ItemData[]}
        */
        const shop = this.list(guildID)
        const item = shop.find(x => x.id == itemID || x.itemName == itemID)

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null
        return item
    }

    /**
     * Searches for the item in the shop.
     * 
     * This method is an alias for the `ShopManager.searchItem()` method.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} guildID Guild ID.
     * @returns {ItemData} If item not found: null; else: item info object.
     */
    findItem(itemID, guildID) {
        return this.searchItem(itemID, guildID)
    }

    /**
     * Searches for the item in the inventory.
     *
     * [!!!] This method is deprecated.
     * If you want to get all the bugfixes and
     * use the newest inventory features, please
     * switch to the usage of the new InventoryManager.
     * 
     * [!!!] No help will be provided for inventory
     * related methods in ShopManager.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {InventoryData} If item not found: null; else: item info object.
     * @deprecated
     */
    searchInventoryItem(itemID, memberID, guildID) {
        if (this.options.deprecationWarnings) {
            console.log(
                errors.deprecationWarning(
                    'ShopManager', 'searchInventoryItem',
                    'InventoryManager', 'searchItem'
                )
            )
        }

        /**
        * @type {InventoryData[]}
        */
        const inventory = this._inventory.fetch(memberID, guildID)
        const item = inventory.find(x => x.id == itemID || x.itemName == itemID)

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null
        return item
    }

    /**
     * Buys the item from the shop.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {String} reason The reason why the money was subtracted. Default: 'received the item from the shop'.
     * @returns {Boolean | String} 
     * If item bought successfully: true; if item not found, false will be returned; 
     * if user reached the item's max amount: 'max' string.
     */
    buy(itemID, memberID, guildID, reason = 'received the item from the shop') {

        /**
        * @type {ItemData[]}
        */
        const shop = this.list(guildID)
        const item = shop.find(x => x.id == itemID || x.itemName == itemID)

        /**
        * @type {InventoryData[]}
        */
        const inventory = this._inventory.fetch(memberID, guildID)
        const inventoryItems = inventory.filter(x => x.itemName == item.itemName)

        /**
         * @type {HistoryData[]}
         */
        const history = this.fetcher.fetchHistory(memberID, guildID) || []

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return false
        if (item.maxAmount && inventoryItems.length >= item.maxAmount) return 'max'

        const itemData = {
            id: inventory.length ? inventory[inventory.length - 1].id + 1 : 1,
            itemName: item.itemName,
            price: item.price,
            message: item.message,
            description: item.description,
            role: item.role || null,
            maxAmount: item.maxAmount,
            date: new Date().toLocaleString(this.options.dateLocale || 'en')
        }

        if (this.options.subtractOnBuy) {
            this.balance.subtract(item.price, memberID, guildID, reason)
        }

        this._inventory.addItem(itemID, memberID, guildID)
        this.database.push(`${guildID}.${memberID}.history`, {
            id: history.length ? history[history.length - 1].id + 1 : 1,
            memberID,
            guildID,
            itemName: item.itemName,
            price: item.price,
            role: item.role || null,
            maxAmount: item.maxAmount,
            date: new Date().toLocaleString(this.options.dateLocale || 'en')
        })

        this.emit('shopItemBuy', itemData)
        return true
    }

    /**
     * Buys the item from the shop.
     * 
     * This method is an alias for the `ShopManager.buy()` method.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {String} reason The reason why the money was subtracted. Default: 'received the item from the shop'.
     * @returns {Boolean | String} 
     * If item bought successfully: true; if item not found, false will be returned; 
     * if user reached the item's max amount: 'max' string.
     */
    buyItem(itemID, memberID, guildID, reason) {
        return this.buy(itemID, memberID, guildID, reason)
    }

    /**
     * Shows all items in user's inventory.
     * 
     * [!!!] This method is deprecated.
     * If you want to get all the bugfixes and
     * use the newest inventory features, please
     * switch to the usage of the new InventoryManager.
     * 
     * [!!!] No help will be provided for inventory
     * related methods in ShopManager.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @returns {InventoryData[]} User's inventory array.
     * @deprecated
     */
    inventory(memberID, guildID) {
        if (this.options.deprecationWarnings) {
            console.log(
                errors.deprecationWarning(
                    'ShopManager', 'inventory',
                    'InventoryManager', 'fetch'
                )
            )
        }

        const inventory = this._inventory.fetch(memberID, guildID)

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        return inventory
    }

    /**
     * Uses the item from user's inventory.
     * 
     * [!!!] This method is deprecated.
     * If you want to get all the bugfixes and
     * use the newest inventory features, please
     * switch to the usage of the new InventoryManager.
     * 
     * [!!!] No help will be provided for inventory
     * related methods in ShopManager.
     * @param {Number | String} itemID Item ID or name.
     * @param {String} memberID Member ID.
     * @param {String} guildID Guild ID.
     * @param {Client} client The Discord Client. [Optional]
     * @returns {String | boolean} Item message or null if item not found.
     * @deprecated
     */
    useItem(itemID, memberID, guildID, client) {
        if (this.options.deprecationWarnings) {
            console.log(
                errors.deprecationWarning(
                    'ShopManager', 'useItem',
                    'InventoryManager', 'useItem'
                )
            )
        }

        /**
         * @type {InventoryData[]}
         */
        const inventory = this._inventory.fetch(memberID, guildID)
        const itemIndex = inventory.findIndex(x => x.id == itemID || x.itemName == itemID)
        const item = inventory[itemIndex]

        if (typeof itemID !== 'number' && typeof itemID !== 'string') {
            throw new EconomyError(errors.invalidTypes.editItemArgs.itemID + typeof itemID)
        }
        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        if (!item) return null

        if (item.role) {
            if (item.role && !client) {
                throw new EconomyError(errors.noClient)
            }

            const guild = client.guilds.cache.get(guildID)
            const roleID = item.role.replace('<@&', '').replace('>', '')

            guild.roles.fetch(roleID).then(role => {
                const member = guild.members.cache.get(memberID)

                member.roles.add(role).catch(err => {
                    if (!role) {
                        return console.error(new EconomyError(errors.roleNotFound + roleID))
                    }

                    console.error(
                        `\x1b[31mFailed to give a role "${guild.roles.cache.get(roleID)?.name}"` +
                        `on guild "${guild.name}" to member ${guild.member(memberID).user.tag}:\x1b[36m`
                    )

                    console.error(err)
                    console.error('\x1b[0m')
                })
            })

            this._inventory.removeItem(itemIndex + 1, memberID, guildID)
            this.emit('shopItemUse', item)

            return item.message
        }
    }

    /**
     * Shows the user's purchase history.
     * @param {String} memberID Member ID
     * @param {String} guildID Guild ID
     * @returns {HistoryData[]} User's purchase history.
     */
    history(memberID, guildID) {
        const history = this.fetcher.fetchHistory(memberID, guildID)

        if (typeof memberID !== 'string') {
            throw new EconomyError(errors.invalidTypes.memberID + typeof memberID)
        }

        if (typeof guildID !== 'string') {
            throw new EconomyError(errors.invalidTypes.guildID + typeof guildID)
        }

        return (history || [])
    }
}

/**
 * @typedef {Object} AddItemOptions Options object with item info for 'Economy.shop.addItem' method.
 * @property {String} itemName Item name.
 * @property {String | Number} price Item price.
 * @property {String} [message='You have used this item!'] Item message that will be returned on use.
 * @property {String} [description='Very mysterious item.'] Item description.
 * @property {String | Number} [maxAmount=null] Max amount of the item that user can hold in his inventory.
 * @property {String} [role=null] Role ID from your Discord server.
 * @returns {ItemData} Item info.
 */

/**
 * History data object.
 * @typedef {Object} HistoryData
 * @property {Number} id Item ID in history.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} role ID of Discord Role that will be given to user on item use.
 * @property {String} date Date when the item was bought.
 * @property {String} memberID Member ID.
 * @property {String} guildID Guild ID.
 */

/**
 * Item data object.
 * @typedef {Object} ItemData
 * @property {Number} id Item ID.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} description Item description.
 * @property {String} role ID of Discord Role that will be given to Wuser on item use.
 * @property {Number} maxAmount Max amount of the item that user can hold in his inventory.
 * @property {String} date Date when the item was added in the shop.
 */

/**
 * Inventory data object.
 * @typedef {Object} InventoryData
 * @property {Number} id Item ID in your inventory.
 * @property {String} itemName Item name.
 * @property {Number} price Item price.
 * @property {String} message The message that will be returned on item use.
 * @property {String} role ID of Discord Role that will be given to user on item use.
 * @property {Number} maxAmount Max amount of the item that user can hold in his inventory.
 * @property {String} date Date when the item was bought.
 */

/**
 * Shop manager class.
 * @type {ShopManager}
 */
module.exports = ShopManager