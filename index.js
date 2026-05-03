const { Telegraf, Scenes, session } = require('telegraf');
const { Octokit } = require("@octokit/rest");

// --- GANTI DISINI ---
const BOT_TOKEN = '8503867931:AAF4rYT0Cv1iMus81eTXD1qb6sGEj726y_U';
const GH_TOKEN = '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';

const bot = new Telegraf(BOT_TOKEN);
const octokit = new Octokit({ auth: GH_TOKEN });

const deployWizard = new Scenes.WizardScene(
    'deploy_wizard',
    (ctx) => {
        ctx.reply('🔥 SITUS DEPLOYER ONLINE!\n\nMasukkan Nama Repo Web:\n(Contoh: username/web-keren)');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.repoPath = ctx.message.text;
        ctx.reply('✅ Repo Terkunci. Sekarang PASTE Kode HTML-nya:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const fullRepo = ctx.wizard.state.repoPath;
        const [owner, repo] = fullRepo.split('/');
        const code = ctx.message.text;

        ctx.reply('🚀 Sedang memproses ke GitHub...');

        try {
            let sha;
            try {
                const { data } = await octokit.repos.getContent({ owner, repo, path: 'index.html' });
                sha = data.sha;
            } catch (e) { sha = null; }

            await octokit.repos.createOrUpdateFileContents({
                owner, repo,
                path: 'index.html',
                message: 'Update via Situs_deployerbot',
                content: Buffer.from(code).toString('base64'),
                sha: sha
            });

            ctx.reply(`✅ BERHASIL!\nCek di: https://${owner}.github.io/${repo}`);
        } catch (err) {
            ctx.reply('❌ GAGAL: ' + err.message);
        }
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([deployWizard]);
bot.use(session());
bot.use(stage.middleware());
bot.command('start', (ctx) => ctx.scene.enter('deploy_wizard'));
bot.launch();

// Biar server gak mati
require('http').createServer((req, res) => { res.write('OK'); res.end(); }).listen(process.env.PORT || 3000);
