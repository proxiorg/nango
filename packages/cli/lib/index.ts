#!/usr/bin/env node

/*
 * Copyright (c) 2022 Nango, all rights reserved.
 */

import { Command } from 'commander';
import axios from 'axios';
import https from 'https';

const program = new Command();

let localhost = 'http://localhost:3003';
var hostport = process.env['NANGO_HOSTPORT'] || 'https://api.nango.dev';

if (hostport.slice(-1) === '/') {
    hostport = hostport.slice(0, -1);
}

// Test from the package root (/packages/cli) with 'node dist/index.js'
program
    .name('nango')
    .description(
        "A CLI tool to configure Nango.\n\n IMPORTANT: You need to set the NANGO_HOSTPORT environment variable if Nango Server doesn't run on http://localhost:3003."
    );

program
    .command('config:list')
    .description('List all provider configurations.')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, __) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + '/config';
        await axios
            .get(url, { headers: enrichHeaders(options), httpsAgent: httpsAgent() })
            .then((res) => {
                console.log(res.data);
                console.table(
                    res.data['configs'].map((o: any) => {
                        return { unique_key: o.unique_key, provider: o.provider, created: o.created_at };
                    })
                );
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program
    .command('config:get')
    .description('Get an provider configuration.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (chosen by you upon creating this provider configuration).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + `/config/${command.provider_config_key()}`;
        await axios
            .get(url, { headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((res) => {
                console.table(res.data['config']);
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program
    .command('config:create')
    .description('Create an provider configuration.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (choose a friendly name, e.g. hubspot_staging).')
    .argument('<provider>', 'The provider of the 3rd-party API, must match the template keys in https://nango.dev/oauth-providers (e.g. hubspot).')
    .argument('<oauth_client_id>', 'The OAuth Client ID obtained from the API provider.')
    .argument('<oauth_client_secret>', 'The OAuth Client Secret obtained from the API provider.')
    .argument('<oauth_scopes>', 'The OAuth Scopes obtained from the API provider (comma-separated).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let body = {
            provider_config_key: command.provider_config_key(),
            provider: command.provider(),
            oauth_client_id: command.oauth_client_id(),
            oauth_client_secret: command.oauth_client_secret(),
            oauth_scopes: command.oauth_scopes()
        };

        let url = getHost(isLocal) + `/config`;
        await axios
            .post(url, body, { headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((_) => {
                console.log('\n\n✅ Successfully created a new provider configuration!\n\n');
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program
    .command('config:edit')
    .description('Edit an provider configuration.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (choose a friendly name, e.g. hubspot_staging).')
    .argument('<provider>', 'The provider of the 3rd-party API, must match the template keys in https://nango.dev/oauth-providers (e.g. hubspot).')
    .argument('<oauth_client_id>', 'The OAuth Client ID obtained from the API provider.')
    .argument('<oauth_client_secret>', 'The OAuth Client Secret obtained from the API provider.')
    .argument('<oauth_scopes>', 'The OAuth Scopes obtained from the API provider (comma-separated).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let body = {
            provider_config_key: command.provider_config_key(),
            provider: command.provider(),
            oauth_client_id: command.oauth_client_id(),
            oauth_client_secret: command.oauth_client_secret(),
            oauth_scopes: command.oauth_scopes()
        };

        let url = getHost(isLocal) + `/config`;
        await axios
            .put(url, body, { headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((_) => {
                console.log('\n\n✅ Successfully edited an existing provider configuration!\n\n');
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program
    .command('config:delete')
    .description('Delete an provider configuration.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (chosen by you upon creating this provider configuration).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + `/config/${command.provider_config_key()}`;
        await axios
            .delete(url, { headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((_) => {
                console.log('\n\n✅ Successfully deleted a provider configuration!\n\n');
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program
    .command('connection:get')
    .description('Get a connection with credentials.')
    .argument('<connection_id>', 'The ID of the Connection.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (chosen by you upon creating this provider configuration).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + `/connection/${command.connection_id()}`;
        await axios
            .get(url, { params: { provider_config_key: command.provider_config_key() }, headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((res) => {
                console.log(res.data);
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data.error || err}`);
            });
    });

program
    .command('token:get')
    .description('Get an access token.')
    .argument('<connection_id>', 'The ID of the Connection.')
    .argument('<provider_config_key>', 'The unique key of the provider configuration (chosen by you upon creating this provider configuration).')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, command) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + `/connection/${command.connection_id()}`;
        await axios
            .get(url, { params: { provider_config_key: command.provider_config_key() }, headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((response) => {
                switch (response.data.credentials.type) {
                    case 'OAUTH2':
                        console.table({ token: response.data.credentials.access_token });
                        break;
                    case 'OAUTH1':
                        console.table(`token:${response.data.credentials.oauth_token}\nsecret:${response.data.credentials.oauth_token_secret}`);
                        break;
                    default:
                        throw Error(`Unrecognized OAuth type '${response.data.credentials.type}' in stored credentials.`);
                }
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data.error || err.message}`);
            });
    });

program
    .command('connection:list')
    .description('List connections without credentials.')
    .option('-l, --local', 'Running Nango on localhost.')
    .action(async (_, options, __) => {
        let isLocal = options.local;
        let url = getHost(isLocal) + `/connection`;
        await axios
            .get(url, { headers: enrichHeaders(), httpsAgent: httpsAgent() })
            .then((res) => {
                console.table(res.data['connections']);
            })
            .catch((err) => {
                console.log(`❌ ${err.response?.data || err}`);
            });
    });

program.parseAsync(process.argv);

function getHost(isLocal: boolean) {
    return isLocal ? localhost : hostport;
}

function enrichHeaders(headers: Record<string, string | number | boolean> = {}) {
    if (process.env['NANGO_SECRET_KEY']) {
        if (hostport.includes('https://api.nango.dev')) {
            headers['Authorization'] = 'Bearer ' + process.env['NANGO_SECRET_KEY'];
        } else {
            headers['Authorization'] = 'Basic ' + Buffer.from(process.env['NANGO_SECRET_KEY'] + ':').toString('base64');
        }
    }

    return headers;
}

function httpsAgent() {
    return new https.Agent({
        rejectUnauthorized: false
    });
}
