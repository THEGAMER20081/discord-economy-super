const { Client, Intents } = require('discord.js')
const Economy = require('discord-economy-super')
const bot = new Client({
    partials: ['USER', 'GUILD_MEMBER', 'CHANNEL', 'MESSAGE', 'REACTION'],
    ws: {
        intents: Intents.ALL
    }
})
const eco = new Economy({
    storagePath: './storage.json',
    updateCountdown: 1000,
    checkStorage: true,
    dailyAmount: 100,
    workAmount: [10, 50],
    weeklyAmount: 1000,
    dailyCooldown: 60000 * 60 * 24,
    workCooldown: 60000 * 60,
    weeklyCooldown: 60000 * 60 * 24 * 7,
    dateLocale: 'ru',
    updater: {
        checkUpdates: true,
        upToDateMessage: true
    },
    errorHandler: {
        handleErrors: true,
        attempts: 5,
        time: 3000
    }
})
bot.on('ready', () => {
    console.log(bot.user.tag + ' is ready!')
    bot.user.setActivity('Test Bot!', { type: 'STREAMING', url: 'https://twitch.tv/twitch' })
})
bot.on('message', async message => {
    const args = message.content.slice(1).trim().split(' ').slice(1)
    if (message.content.startsWith('+help')) return message.channel.send('**__Bot Commands:__**\n+help\n+balance\n+daily\n+weekly\n+work\n+lb (+leaderboard)\n+cash\n+deposit (+dep)')
    if (message.content.startsWith('+daily')) {
        const daily = eco.rewards.daily(message.author.id, message.guild.id)
        if (!daily.status) return message.channel.send(`You have already claimed your daily reward! Time left until next claim: **${daily.value.days}** days, **${daily.value.hours}** hours, **${daily.value.minutes}** minutes and **${daily.value.seconds}** seconds.`)
        message.channel.send(`You have received **${daily.reward}** daily coins!`)
    }
    if (message.content.startsWith('+work')) {
        let work = eco.rewards.work(message.author.id, message.guild.id)
        if (!work.status) return message.channel.send(`You have already worked! Time left until next work: **${work.value.days}** days, **${work.value.hours}** hours, **${work.value.minutes}** minutes and **${work.value.seconds}** seconds.`)
        message.channel.send(`You worked hard and earned **${work.pretty}** coins!`)
    }
    if (message.content.startsWith('+weekly')) {
        let weekly = eco.rewards.weekly(message.author.id, message.guild.id)
        if (!weekly.status) return message.channel.send(`You have already claimed your weekly reward! Time left until next claim: **${weekly.value.days}** days, **${weekly.value.hours}** hours, **${weekly.value.minutes}** minutes and **${weekly.value.seconds}** seconds.`)
        message.channel.send(`You have received **${weekly.reward}** weekly coins!`)
    }
    if (message.content.startsWith('+lb') || message.content.startsWith('+leaderboard')) {
        const lb = eco.balance.leaderboard(message.guild.id)
        if (!lb.length) return message.channel.send('Cannot generate a leaderboard: the server database is empty.')
        message.channel.send(`Money Leaderboard for **${message.guild.name}**\n-----------------------------------\n` + lb.map((x, i) => `${i + 1}. <@${x.userID}> - ${x.money} coins`).join('\n'))
    }
    if (message.content.startsWith('+balance')) {
        let member = message.guild.member(message.mentions.members.first() || message.author)
        
        let balance = eco.balance.fetch(member.id, message.guild.id)
        let bank = eco.bank.fetch(member.user.id, message.guild.id)
        
        message.channel.send(`**${member.user.username}**'s Balance:\nCash: **${balance}** coins.\nBank: **${bank}** coins.`)
    }
    if (message.content.startsWith('+cash')) {
        const amount = args[0]
        const balance = eco.bank.fetch(message.author.id, message.guild.id)

        if (!amount) return message.channel.send('Specify an amount.')
        if (isNaN(amount)) return message.channel.send('Amount must be a number.')
        if (amount > balance) return message.channel.send(`You don\'t have enough money in your bank to send **${amount}** coins on your balance.`)
        
        eco.balance.add(amount, message.author.id, message.guild.id)
        eco.bank.subtract(amount, message.author.id, message.guild.id)
        
        message.channel.send(`Successfully sent **${amount}** on your balance!`)
    }

    if (message.content.startsWith('+deposit') || message.content.startsWith('+dep')) {
        const amount = args[0]
        const balance = eco.balance.fetch(message.author.id, message.guild.id)
        
        if (!amount) return message.channel.send('Specify an amount.')
        if (isNaN(amount)) return message.channel.send('Amount must be a number.')
        if (amount > balance) return message.channel.send(`You don\'t have enough money on your balance to deposit **${amount}** coins.`)
        
        eco.balance.subtract(amount, message.author.id, message.guild.id)
        eco.bank.add(amount, message.author.id, message.guild.id)
        
        message.channel.send(`Successfully deposited **${amount}** coins!`)
    }
})
bot.login('token')